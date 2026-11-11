const fsp = require("fs/promises");
const path = require("path");
const request = require("supertest");
const { setup, teardown, write, exists } = require("../helpers");
const { scanForDuplicates, deleteDuplicates } = require("../../src/services/scanDuplicates");
const { createScan, getFileIndexByPath } = require("../../src/db/scans");
const { listDeletedFiles } = require("../../src/db/deletedFiles");

let ctx, app;
beforeEach(async () => { ctx = await setup(); app = require("../../src/app"); });
afterEach(async () => { await teardown(ctx); });
const w = (name, content = "x") => write(path.join(ctx.work, name), content);
const del = (body) => request(app).delete("/api/files/delete").send(body);

describe("LC-10 typeof file !== 'string' || file.trim() === ''", () => {
  test("LC-10-1 valid string -> F, proceeds", async () => {
    const f = await w("a");
    await expect(deleteDuplicates([f])).resolves.toMatchObject({ deleted: 1 });
  });
  test.each([[123], ["   "], [""]])("LC-10 %p -> 400", async (bad) => {
    await expect(deleteDuplicates([bad])).rejects.toMatchObject({ status: 400 });
  });
});

describe("LC-11 !stat.isFile()", () => {
  test("LC-11-T directory path rejected", async () => {
    await expect(deleteDuplicates([ctx.work])).rejects.toMatchObject({ status: 400 });
  });
  test("LC-11-F file path proceeds", async () => {
    await expect(deleteDuplicates([await w("a")])).resolves.toMatchObject({ deleted: 1 });
  });
});

describe("LC-12 !files || !Array.isArray(files) || files.length === 0", () => {
  test("LC-12-base ['a'] passes the check (then fails later as missing file, not 400)", async () => {
    expect((await del({ files: [path.join(ctx.work, "nope")] })).status).toBe(404);
  });
  test.each([
    ["missing files", {}],
    ["string files", { files: "a" }],
    ["empty array", { files: [] }],
  ])("LC-12 %s -> 400", async (_n, body) => {
    expect((await del(body)).status).toBe(400);
  });
});

describe("LC-13 files.every(string)", () => {
  test("LC-13-F one non-string -> 400", async () => {
    expect((await del({ files: ["a", 1] })).status).toBe(400);
  });
  test("LC-13-T all strings -> passes check", async () => {
    expect((await del({ files: [await w("a")] })).status).toBe(200);
  });
});

// A = scanId != null, B = isInteger, C = > 0. When A is false B and C are never evaluated
// (short-circuit), so the (A=F,B=T,C=F) row of the full truth table is infeasible.
describe("LC-14 scanId != null && !(isInteger && > 0)", () => {
  test("LC-14-1 scanId=valid -> accepted", async () => {
    const id = createScan(ctx.work);
    expect((await del({ files: [await w("a")], scanId: id })).status).toBe(200);
  });
  test("LC-14-2 scanId=-1 (A,B,!C) -> 400", async () => {
    expect((await del({ files: ["a"], scanId: -1 })).status).toBe(400);
  });
  test("LC-14-3 scanId=1.5 (A,!B,C) -> 400", async () => {
    expect((await del({ files: ["a"], scanId: 1.5 })).status).toBe(400);
  });
  test("LC-14-4 scanId omitted (!A) -> accepted", async () => {
    expect((await del({ files: [await w("a")] })).status).toBe(200);
  });
});

describe("deleteDuplicates effects", () => {
  test("moves to recovery folder, writes history row, drops index entry", async () => {
    const a = await w("a", "same"); await w("b", "same");
    await scanForDuplicates(ctx.work);
    expect(getFileIndexByPath(a)).not.toBeNull();

    await deleteDuplicates([a]);

    const [row] = listDeletedFiles();
    expect(row.originalPath).toBe(a);
    expect(await exists(a)).toBe(false);
    expect(await exists(row.recoveryPath)).toBe(true);
    expect(getFileIndexByPath(a)).toBeNull();
  });

  test("[PROBE A3] batch [ok, missing, ok] is atomic: nothing moved on failure", async () => {
    const f1 = await w("f1"); const f3 = await w("f3");
    await expect(deleteDuplicates([f1, path.join(ctx.work, "f2"), f3])).rejects.toThrow();
    expect(await exists(f1)).toBe(true); // fails if f1 was already moved (non-atomic)
    expect(await exists(f3)).toBe(true);
  });
});
