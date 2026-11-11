const fsp = require("fs/promises");
const path = require("path");
const request = require("supertest");
const { setup, teardown, write } = require("../helpers");

let ctx, app;
beforeEach(async () => { ctx = await setup(); app = require("../../src/app"); });
afterEach(async () => { await teardown(ctx); });
const put = (body) => request(app).put("/api/settings").send(body);

describe("C9 settings", () => {
  test.each([7, 30, 90, 180, 365, null])("ISP-50 P9.1 allowed %p", async (v) => {
    const r = await put({ scanRetentionDays: v });
    expect(r.status).toBe(200);
    expect((await request(app).get("/api/settings")).body.scanRetentionDays).toBe(v);
  });
  test.each([0, 14, "30"])("ISP-51 P9.2 disallowed %p -> 400", async (v) =>
    expect((await put({ scanRetentionDays: v })).status).toBe(400));
});

describe("C3/C4 preview", () => {
  const get = (p) => request(app).get("/api/files/preview").query({ path: p });
  const f = (name, c = "x") => write(path.join(ctx.work, name), c);

  test.each([["a.png", "image/png"], ["a.PNG", "image/png"], ["a.pdf", "application/pdf"], ["a.jpeg", "image/jpeg"]])(
    "ISP-20/21 preview-eligible %s", async (n, mime) => {
      const r = await get(await f(n));
      expect(r.status).toBe(200); expect(r.headers["content-type"]).toContain(mime);
    });
  test.each(["a.mp4", "a.docx", "a.txt", "noext", "a.unknownext"])("ISP-20/21 not eligible %s -> 400", async (n) =>
    expect((await get(await f(n))).status).toBe(400));
  test("ISP-22 P3.5 > 20 MB -> 400", async () => {
    const p = await f("big.pdf"); await fsp.truncate(p, 20 * 1024 * 1024 + 1);
    expect((await get(p)).status).toBe(400);
  });
  test("preview: missing file 404, directory 400, missing param 400", async () => {
    expect((await get(path.join(ctx.work, "no.png"))).status).toBe(404);
    expect((await get(path.join(ctx.work, "d.png"))).status).toBe(404);
    expect((await request(app).get("/api/files/preview")).status).toBe(400);
  });
});
