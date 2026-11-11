const fsp = require("fs/promises");
const os = require("os");
const path = require("path");

// Fresh temp dir + fresh SQLite DB + fresh recovery folder per test.
async function setup() {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), "replica-test-"));
  process.env.DATABASE_PATH = path.join(root, "db", "replica.sqlite");
  process.env.RECOVERY_PATH = path.join(root, "recovery");
  const work = path.join(root, "work");
  await fsp.mkdir(work);
  require("../src/db").openDatabase();
  return { root, work };
}

async function teardown(ctx) {
  require("../src/db").closeDatabase();
  await fsp.chmod(path.join(ctx.work), 0o755).catch(() => {});
  await fsp.rm(ctx.root, { recursive: true, force: true });
}

async function write(filePath, content = "x") {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, content);
  return filePath;
}

const exists = (p) => fsp.access(p).then(() => true, () => false);

// Whole seconds only: avoids sub-ms rounding differences against Math.trunc(mtimeMs).
const setMtime = (p, seconds) => fsp.utimes(p, seconds, seconds);

function err(code) {
  return Object.assign(new Error(code), { code });
}

module.exports = { setup, teardown, write, exists, setMtime, err };
