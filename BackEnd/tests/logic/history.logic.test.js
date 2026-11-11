const fsp = require("fs/promises");
const path = require("path");
const { setup, teardown, write, exists, err } = require("../helpers");
const { deleteDuplicates } = require("../../src/services/scanDuplicates");
const { getHistory, restoreDeletedFiles } = require("../../src/services/history");
const { createDeletedFile, listDeletedFiles } = require("../../src/db/deletedFiles");
const { getDb } = require("../../src/db");

let ctx;
beforeEach(async () => { ctx = await setup(); });
afterEach(async () => { jest.restoreAllMocks(); await teardown(ctx); });

// Creates a real file, deletes it into recovery, returns the history row.
async function deleted(name = "a.txt") {
  const p = await write(path.join(ctx.work, name), "data");
  await deleteDuplicates([p]);
  return listDeletedFiles().find((r) => r.originalPath === p);
}

describe("LC-20 !Array.isArray(ids) || ids.length === 0", () => {
  test("LC-20-1 valid", async () => {
    const r = await deleted();
    await expect(restoreDeletedFiles([r.id])).resolves.toMatchObject({ restored: 1 });
  });
  test.each([["non-array", 1], ["empty", []]])("LC-20 %s -> 400", async (_n, ids) => {
    await expect(restoreDeletedFiles(ids)).rejects.toMatchObject({ status: 400 });
  });
});

describe("LC-21 !ids.every(isInteger && > 0)", () => {
  test.each([[[1.5]], [[0]], [[-1]], [["1"]]])("LC-21 %j -> 400", async (ids) => {
    await expect(restoreDeletedFiles(ids)).rejects.toMatchObject({ status: 400 });
  });
});

describe("LC-22 rows.length !== ids.length", () => {
  test("LC-22-T unknown id -> 404", async () => {
    await expect(restoreDeletedFiles([9999])).rejects.toMatchObject({ status: 404 });
  });
  test("LC-22-F all ids exist", async () => {
    const r = await deleted();
    await expect(restoreDeletedFiles([r.id])).resolves.toBeDefined();
  });
});

test("LC-23 row.restoredAt: second restore rejected (400)", async () => {
  const r = await deleted();
  await restoreDeletedFiles([r.id]);
  await expect(restoreDeletedFiles([r.id])).rejects.toMatchObject({ status: 400 });
});

test("LC-24 !row.recoveryPath -> 400", async () => {
  const id = createDeletedFile({ originalPath: "/x", size: 1, recoveryPath: null });
  await expect(restoreDeletedFiles([id])).rejects.toMatchObject({ status: 400 });
});

test("LC-25 recovery file missing on disk -> 404; present -> ok (LC-20-1)", async () => {
  const r = await deleted();
  await fsp.rm(r.recoveryPath);
  await expect(restoreDeletedFiles([r.id])).rejects.toMatchObject({ status: 404 });
});

test("LC-26 original location occupied -> 409; free -> restored", async () => {
  const r = await deleted();
  await write(r.originalPath, "new");
  await expect(restoreDeletedFiles([r.id])).rejects.toMatchObject({ status: 409 });
  await fsp.rm(r.originalPath);
  await restoreDeletedFiles([r.id]);
  expect(await fsp.readFile(r.originalPath, "utf8")).toBe("data");
});

describe("LC-27 moveFileSafely error.code !== 'EXDEV'", () => {
  test("LC-27-F EXDEV -> copy+unlink fallback succeeds", async () => {
    const r = await deleted();
    jest.spyOn(fsp, "rename").mockRejectedValueOnce(err("EXDEV"));
    await restoreDeletedFiles([r.id]);
    expect(await exists(r.originalPath)).toBe(true);
    expect(await exists(r.recoveryPath)).toBe(false);
  });
  test("LC-27-T EACCES -> rethrown, recovery copy untouched", async () => {
    const r = await deleted();
    jest.spyOn(fsp, "rename").mockRejectedValueOnce(err("EACCES"));
    await expect(restoreDeletedFiles([r.id])).rejects.toMatchObject({ code: "EACCES" });
    expect(await exists(r.recoveryPath)).toBe(true);
  });
});

describe("LC-28 canRestore: restoredAt == null && recoveryPath", () => {
  const canRestore = (id) => getHistory().deletedFiles.find((f) => f.id === id).canRestore;
  test("LC-28-1 (null, path) -> true", async () => {
    expect(canRestore((await deleted()).id)).toBe(true);
  });
  test("LC-28-2 (date, path) -> false (forced via SQL; markRestored normally clears path)", async () => {
    const r = await deleted();
    getDb().prepare("UPDATE deleted_files SET restored_at = ? WHERE id = ?").run("2020-01-01", r.id);
    expect(canRestore(r.id)).toBe(false);
  });
  test("LC-28-3 (null, null) -> false", async () => {
    expect(canRestore(createDeletedFile({ originalPath: "/x", size: 1, recoveryPath: null }))).toBe(false);
  });
  test("LC-28 [PROBE A3] recovery file removed -> history should not offer restore", async () => {
    const r = await deleted();
    await fsp.rm(r.recoveryPath);
    expect(canRestore(r.id)).toBe(false); // fails if orphaned record still says restorable
  });
});
