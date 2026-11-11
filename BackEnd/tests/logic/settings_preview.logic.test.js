const fsp = require("fs/promises");
const path = require("path");
const request = require("supertest");
const { setup, teardown, write } = require("../helpers");
const { updateSettings, pruneExpiredHistory } = require("../../src/services/settings");
const { getDb } = require("../../src/db");

let ctx, app;
beforeEach(async () => { ctx = await setup(); app = require("../../src/app"); });
afterEach(async () => { await teardown(ctx); });

describe("LC-30 !body || !('scanRetentionDays' in body)", () => {
  test("LC-30-1 valid body", () => {
    expect(updateSettings({ scanRetentionDays: 30 }).settings.scanRetentionDays).toBe(30);
  });
  test.each([["undefined", undefined], ["{}", {}]])("LC-30 %s -> 400", (_n, body) => {
    expect(() => updateSettings(body)).toThrow(expect.objectContaining({ status: 400 }));
  });
});

describe("LC-31 !OPTIONS.includes(value)", () => {
  test("LC-31-F 30 accepted", () => expect(() => updateSettings({ scanRetentionDays: 30 })).not.toThrow());
  test("LC-31-T 14 rejected", () =>
    expect(() => updateSettings({ scanRetentionDays: 14 })).toThrow(expect.objectContaining({ status: 400 })));
});

describe("LC-32 scanRetentionDays == null", () => {
  const scan = (iso) =>
    getDb().prepare("INSERT INTO scans (directory, started_at, status) VALUES ('/x', ?, 'completed')").run(iso);
  const count = () => getDb().prepare("SELECT COUNT(*) n FROM scans").get().n;

  test("LC-32-T null -> no pruning", () => {
    scan("2000-01-01T00:00:00.000Z");
    updateSettings({ scanRetentionDays: null });
    expect(pruneExpiredHistory()).toEqual({ removedScans: 0, removedHashes: 0, removedRestored: 0 });
    expect(count()).toBe(1);
  });
  test("LC-32-F 7 -> old scan removed, recent kept", () => {
    scan("2000-01-01T00:00:00.000Z");
    scan(new Date().toISOString());
    updateSettings({ scanRetentionDays: 7 });
    expect(count()).toBe(1);
  });
});

describe("LC-50 preview extension check (image || pdf)", () => {
  const get = (p) => request(app).get("/api/files/preview").query({ path: p });
  test.each([["a.png", 200], ["a.pdf", 200], ["a.txt", 400]])("LC-50 %s -> %i", async (name, status) => {
    expect((await get(await write(path.join(ctx.work, name), "x"))).status).toBe(status);
  });
});

describe("LC-51 size > MAX_PREVIEW_BYTES (strict >)", () => {
  const MAX = 20 * 1024 * 1024;
  const sized = async (n) => {
    const p = path.join(ctx.work, "big.png");
    await fsp.writeFile(p, "");
    await fsp.truncate(p, n); // sparse
    return p;
  };
  const get = (p) => request(app).get("/api/files/preview").query({ path: p });
  test("LC-51-F exactly 20 MB accepted", async () => expect((await get(await sized(MAX))).status).toBe(200));
  test("LC-51-T 20 MB + 1 rejected", async () => expect((await get(await sized(MAX + 1))).status).toBe(400));
});
