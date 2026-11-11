// C7 delete request shape, C8 restore state, plus mixed batch / scanId.
const fsp = require("fs/promises");
const path = require("path");
const request = require("supertest");
const { setup, teardown, write, exists } = require("../helpers");
const { createDeletedFile, listDeletedFiles } = require("../../src/db/deletedFiles");

let ctx, app;
beforeEach(async () => { ctx = await setup(); app = require("../../src/app"); });
afterEach(async () => { await teardown(ctx); });
const w = (name, content = "x") => write(path.join(ctx.work, name), content);
const del = (body) => request(app).delete("/api/files/delete").send(body);
const restore = (ids) => request(app).post("/api/history/restore").send({ ids });

describe("C7 delete request", () => {
  test("ISP-30 P7.1 valid paths (base)", async () => {
    const r = await del({ files: [await w("a"), await w("b")] });
    expect(r.status).toBe(200); expect(r.body.deleted).toBe(2);
  });
  test("ISP-31 P7.2 empty array -> 400", async () => expect((await del({ files: [] })).status).toBe(400));
  test.each([["missing", {}], ["non-array", { files: "a" }]])("ISP-31 P7.3 %s -> 400", async (_n, b) =>
    expect((await del(b)).status).toBe(400));
  test("ISP-32 P7.4 non-string entry -> 400", async () => expect((await del({ files: [1] })).status).toBe(400));
  test("ISP-32 P7.4 blank string -> 400", async () => expect((await del({ files: ["  "] })).status).toBe(400));
  test("ISP-33 P7.5 directory -> 400", async () => expect((await del({ files: [ctx.work] })).status).toBe(400));
  test("ISP-33 P7.6 non-existent -> 404", async () =>
    expect((await del({ files: [path.join(ctx.work, "nope")] })).status).toBe(404));
  test.each([[0], [-3], [2.5]])("ISP-34 invalid scanId %p -> 400", async (scanId) =>
    expect((await del({ files: [await w("a")], scanId })).status).toBe(400));
  test("ISP-34 scanId omitted -> 200", async () => expect((await del({ files: [await w("a")] })).status).toBe(200));
  test("ISP-34 valid-looking scanId that does not exist [PROBE: should not be a 500]", async () =>
    expect((await del({ files: [await w("a")], scanId: 999 })).status).toBeLessThan(500));
  test("ISP-35 mixed batch [valid, missing]: all-or-nothing? [PROBE]", async () => {
    const ok = await w("ok");
    await del({ files: [ok, path.join(ctx.work, "nope")] });
    expect(await exists(ok)).toBe(true);
  });
});

describe("C8 restore", () => {
  async function deleted(name = "a") {
    const p = await w(name, "data");
    await del({ files: [p] });
    return listDeletedFiles().find((r) => r.originalPath === p);
  }
  test("ISP-40 P8.1 valid (base)", async () => {
    const r = await deleted();
    const res = await restore([r.id]);
    expect(res.status).toBe(200);
    expect(await fsp.readFile(r.originalPath, "utf8")).toBe("data");
  });
  test("ISP-41 P8.2 unknown id -> 404", async () => expect((await restore([9999])).status).toBe(404));
  test("ISP-41 P8.3 already restored -> 400", async () => {
    const r = await deleted(); await restore([r.id]);
    expect((await restore([r.id])).status).toBe(400);
  });
  test("ISP-42 P8.4 no recovery path -> 400", async () =>
    expect((await restore([createDeletedFile({ originalPath: "/x", size: 1, recoveryPath: null })])).status).toBe(400));
  test("ISP-42 recovery file missing on disk -> 404", async () => {
    const r = await deleted(); await fsp.rm(r.recoveryPath);
    expect((await restore([r.id])).status).toBe(404);
  });
  test("ISP-43 P8.5 destination occupied -> 409", async () => {
    const r = await deleted(); await write(r.originalPath, "new");
    expect((await restore([r.id])).status).toBe(409);
  });
  test.each([[[]], [[1.5]], [["1"]], [undefined]])("ISP-44 P8.6 invalid ids %j -> 400", async (ids) =>
    expect((await restore(ids)).status).toBe(400));
});
