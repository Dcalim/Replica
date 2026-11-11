const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");
const { setup, teardown, write, setMtime } = require("../helpers");
const { scanForDuplicates } = require("../../src/services/scanDuplicates");
const { getDb } = require("../../src/db");

let ctx;
beforeEach(async () => { ctx = await setup(); });
afterEach(async () => { jest.restoreAllMocks(); await teardown(ctx); });

const w = (name, content) => write(path.join(ctx.work, name), content);
const hashSpy = () => jest.spyOn(crypto, "createHash");

describe("LC-01 !stat.isDirectory()", () => {
  test("LC-01-T root is a directory -> proceeds", async () => {
    await expect(scanForDuplicates(ctx.work)).resolves.toMatchObject({ scannedFiles: 0 });
  });
  test("LC-01-F root is a regular file -> rejected (400)", async () => {
    const f = await w("f.txt");
    await expect(scanForDuplicates(f)).rejects.toMatchObject({ status: 400 });
  });
});

describe("LC-02 entry.isSymbolicLink()", () => {
  test("LC-02-T symlink is skipped", async () => {
    const a = await w("a.txt", "same");
    await w("b.txt", "same");
    await fsp.symlink(a, path.join(ctx.work, "link.txt"));
    const r = await scanForDuplicates(ctx.work);
    expect(r.scannedFiles).toBe(2);
    expect(r.files.some((f) => f.endsWith("link.txt"))).toBe(false);
  });
  test("LC-02-F no symlink -> all files counted", async () => {
    await w("a.txt"); await w("b.txt");
    expect((await scanForDuplicates(ctx.work)).scannedFiles).toBe(2);
  });
});

describe("LC-03 entry.isDirectory()", () => {
  test("LC-03-T nested subdir is recursed", async () => {
    await w("sub/deep/a.txt");
    expect((await scanForDuplicates(ctx.work)).scannedFiles).toBe(1);
  });
  test("LC-03-F flat dir", async () => {
    await w("a.txt");
    expect((await scanForDuplicates(ctx.work)).scannedFiles).toBe(1);
  });
});

describe("LC-04 entry.isFile()", () => {
  test("LC-04-T regular file counted", async () => {
    await w("a.txt");
    expect((await scanForDuplicates(ctx.work)).scannedFiles).toBe(1);
  });
  const fifo = process.platform === "win32" ? test.skip : test;
  fifo("LC-04-F FIFO (not file/dir/symlink) ignored", async () => {
    execSync(`mkfifo "${path.join(ctx.work, "pipe")}"`);
    await w("a.txt");
    expect((await scanForDuplicates(ctx.work)).scannedFiles).toBe(1);
  });
});

describe("LC-05 sameSizeFiles.length < 2", () => {
  test("LC-05-T unique sizes -> hashFile never called", async () => {
    await w("a", "1"); await w("b", "22");
    const spy = hashSpy();
    await scanForDuplicates(ctx.work);
    expect(spy).toHaveBeenCalledTimes(0);
  });
  test("LC-05-F same size -> both hashed", async () => {
    await w("a", "11"); await w("b", "22");
    const spy = hashSpy();
    await scanForDuplicates(ctx.work);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("LC-06 cache reuse: cached.hash && mtime equal && size equal (CACC)", () => {
  // Two same-size files so both are hashed; first scan fills the index.
  let a, b;
  beforeEach(async () => {
    a = await w("a", "same"); b = await w("b", "same");
    await setMtime(a, 1_700_000_000); await setMtime(b, 1_700_000_000);
    await scanForDuplicates(ctx.work);
  });
  const rescan = () => scanForDuplicates(ctx.work);
  const idx = (sql) => getDb().prepare(sql).run(a);

  test("LC-06-1 a=T b=T c=T -> reused", async () => {
    const spy = hashSpy();
    const r = await rescan();
    expect(r).toMatchObject({ reusedHashes: 2, computedHashes: 0 });
    expect(spy).toHaveBeenCalledTimes(0);
  });
  test("LC-06-2 a=F (null hash) -> recomputed", async () => {
    idx("UPDATE file_index SET hash = NULL WHERE path = ?");
    expect(await rescan()).toMatchObject({ reusedHashes: 1, computedHashes: 1 });
  });
  test("LC-06-3 b=F (mtime differs) -> recomputed", async () => {
    await setMtime(a, 1_700_000_500);
    expect(await rescan()).toMatchObject({ reusedHashes: 1, computedHashes: 1 });
  });
  test("LC-06-4 c=F (cached size differs) -> recomputed", async () => {
    // Index row altered directly: editing the real file would change its size bucket instead.
    idx("UPDATE file_index SET size = size + 1 WHERE path = ?");
    expect(await rescan()).toMatchObject({ reusedHashes: 1, computedHashes: 1 });
  });
  test("LC-06 [PROBE A3] same size + restored mtime, different content -> no false duplicate", async () => {
    await fsp.writeFile(b, "diff");
    await setMtime(b, 1_700_000_000);
    const r = await rescan();
    expect(r.duplicateGroups).toBe(0); // fails if stale cache gives a false duplicate
  });
});

describe("LC-07 group.files.length >= 2", () => {
  test("LC-07-T true duplicates -> group", async () => {
    await w("a", "same"); await w("b", "same");
    expect((await scanForDuplicates(ctx.work)).duplicateGroups).toBe(1);
  });
  test("LC-07-F same size, different content -> none", async () => {
    await w("a", "aaaa"); await w("b", "bbbb");
    expect((await scanForDuplicates(ctx.work)).duplicateGroups).toBe(0);
  });
});

describe("LC-08 indexEntries.length > 0", () => {
  const count = () => getDb().prepare("SELECT COUNT(*) n FROM file_index").get().n;
  test("LC-08-F only unique sizes -> no upsert", async () => {
    await w("a", "1"); await w("b", "22");
    await scanForDuplicates(ctx.work);
    expect(count()).toBe(0);
  });
  test("LC-08-T hashed files -> upsert", async () => {
    await w("a", "11"); await w("b", "22");
    await scanForDuplicates(ctx.work);
    expect(count()).toBe(2);
  });
});

describe("LC-09 hashFile read error", () => {
  const t = process.platform === "win32" || process.getuid?.() === 0 ? test.skip : test;
  t("LC-09 unreadable file: scan continues, file omitted from groups", async () => {
    await w("a", "same"); await w("b", "same");
    const c = await w("c", "same");
    await fsp.chmod(c, 0o000);
    const r = await scanForDuplicates(ctx.work);
    expect(r.scannedFiles).toBe(3);
    expect(r.duplicates[0].files).toHaveLength(2);
  });
});
