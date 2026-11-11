// Characteristics: C1 directory validity, C2a file population, C2b structure,
// C3 file size, C5 filename, C6 content relation / index state.
const fsp = require("fs/promises");
const path = require("path");
const request = require("supertest");
const { setup, teardown, write, setMtime } = require("../helpers");
const { scanForDuplicates } = require("../../src/services/scanDuplicates");

let ctx, app;
beforeEach(async () => { ctx = await setup(); app = require("../../src/app"); });
afterEach(async () => { await teardown(ctx); });
const w = (name, content = "x") => write(path.join(ctx.work, name), content);
const post = (directory) => request(app).post("/api/files/scan").send({ directory });
const scan = () => scanForDuplicates(ctx.work);

describe("C1 directory validity", () => {
  test("ISP-01 P1.1 existing directory (base)", async () => expect((await post(ctx.work)).status).toBe(200));
  test("ISP-02 P1.2 existing file -> 400", async () => expect((await post(await w("f"))).status).toBe(400));
  test("ISP-03 P1.3 non-existent -> 400 (ENOENT mapping; draft expected 404)", async () =>
    expect((await post(path.join(ctx.work, "nope"))).status).toBe(400));
  const perm = process.platform === "win32" || process.getuid?.() === 0 ? test.skip : test;
  perm("ISP-04 P1.4 no permission -> 403 [PROBE: unreadable root is silently scanned as empty]", async () => {
    const d = path.join(ctx.work, "locked"); await fsp.mkdir(d); await fsp.chmod(d, 0o000);
    expect((await post(d)).status).toBe(403);
    await fsp.chmod(d, 0o755);
  });
  test.each([["empty string", ""], ["non-string", 5], ["missing", undefined]])("ISP-05 P1.5 %s -> 400", async (_n, d) =>
    expect((await post(d)).status).toBe(400));
});

describe("C2a file population", () => {
  test("ISP-06 P2.1 empty dir", async () => expect(await scan()).toMatchObject({ scannedFiles: 0, duplicateGroups: 0 }));
  test("ISP-07 P2.2 single file", async () => { await w("a"); expect((await scan()).duplicateGroups).toBe(0); });
  test("ISP-08 P2.3 all unique sizes", async () => {
    await w("a", "1"); await w("b", "22"); await w("c", "333");
    expect(await scan()).toMatchObject({ scannedFiles: 3, duplicateGroups: 0, computedHashes: 0 });
  });
  test("ISP-09 P2.4 size collisions, different content", async () => {
    await w("a", "aa"); await w("b", "bb");
    expect(await scan()).toMatchObject({ duplicateGroups: 0, computedHashes: 2 });
  });
  test("ISP-10 P2.5 true duplicates (base)", async () => {
    await w("a", "same"); await w("b", "same"); await w("c", "same");
    const r = await scan();
    expect(r.duplicateGroups).toBe(1);
    expect(r.reclaimableBytes).toBe(8);
  });
  test("ISP-11 P2.6 mixed", async () => {
    await w("a", "same"); await w("b", "same"); await w("c", "diff"); await w("d", "u");
    expect(await scan()).toMatchObject({ scannedFiles: 4, duplicateGroups: 1 });
  });
});

describe("C2b structure", () => {
  test("ISP-12 P2.7 nested subdirs (depth 3): duplicates across levels", async () => {
    await w("a", "same"); await w("x/y/z/b", "same");
    expect((await scan()).duplicateGroups).toBe(1);
  });
  test("ISP-13 P2.8 symlink not counted as duplicate of its target", async () => {
    const a = await w("a", "same");
    await fsp.symlink(a, path.join(ctx.work, "link"));
    expect(await scan()).toMatchObject({ scannedFiles: 1, duplicateGroups: 0 });
  });
});

describe("C3 file size", () => {
  test("ISP-14 P3.1 two zero-byte files [PROBE A3: empty files should not be reported as duplicates]", async () => {
    await w("a", ""); await w("b", "");
    expect((await scan()).duplicateGroups).toBe(0);
  });
  test.each([["P3.2 small (<1KB)", 10], ["P3.3 medium (1KB-1MB)", 100 * 1024], ["P3.4 multi-MB", 3 * 1024 * 1024]])(
    "ISP-15 %s", async (_n, size) => {
      const c = Buffer.alloc(size, 7);
      await w("a", c); await w("b", c);
      expect(await scan()).toMatchObject({ duplicateGroups: 1, reclaimableBytes: size });
    });
});

describe("C6 content relation / index state", () => {
  test("ISP-16 P6.1 identical", async () => { await w("a", "same"); await w("b", "same"); expect((await scan()).duplicateGroups).toBe(1); });
  test("ISP-16 P6.2 different content, same size", async () => { await w("a", "aa"); await w("b", "bb"); expect((await scan()).duplicateGroups).toBe(0); });
  test("ISP-16 P6.3 different content and size", async () => { await w("a", "a"); await w("b", "bbb"); expect((await scan()).duplicateGroups).toBe(0); });
  test("ISP-17 P6.4 content changed since last scan (size + mtime changed) -> hash recomputed, no longer duplicate", async () => {
    const a = await w("a", "same"); const b = await w("b", "same");
    await setMtime(a, 1_700_000_000); await setMtime(b, 1_700_000_000);
    await scan();
    await fsp.writeFile(b, "diff"); await setMtime(b, 1_700_000_500);
    expect(await scan()).toMatchObject({ duplicateGroups: 0, reusedHashes: 1, computedHashes: 1 });
  });
  test("ISP-18 hard links [PROBE A3: same inode must not count as reclaimable]", async () => {
    const a = await w("a", "same");
    await fsp.link(a, path.join(ctx.work, "b"));
    expect((await scan()).reclaimableBytes).toBe(0);
  });
});

describe("C5 filename", () => {
  const names = [
    ["P5.1 ASCII", "plain.txt"],
    ["P5.2 spaces/punctuation", "my file (1) & more!.txt"],
    ["P5.3 Unicode", "résumé-日本語-🙂.txt"],
    ["P5.4 long component", "n".repeat(200) + ".txt"],
  ];
  test.each(names)("ISP-23 %s", async (_n, name) => {
    await w(name, "same"); await w("other.txt", "same");
    const r = await scan();
    expect(r.duplicateGroups).toBe(1);
    expect(r.files.some((f) => f.endsWith(name))).toBe(true);
  });
  test("ISP-23 P5.5 relative directory path", async () => {
    await w("a", "same"); await w("b", "same");
    const r = await scanForDuplicates(path.relative(process.cwd(), ctx.work));
    expect(r.duplicateGroups).toBe(1);
    expect(path.isAbsolute(r.directory)).toBe(true);
  });
});
