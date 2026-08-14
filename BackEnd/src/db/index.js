const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { migrations } = require("./migrations");

let db = null;

function getDbPath() {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  return path.join(__dirname, "../../data/replica.sqlite");
}

function migrate(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = database
    .prepare("SELECT version FROM schema_migrations")
    .all()
    .map((row) => row.version);

  const applyMigration = database.transaction((version, run) => {
    run(database);
    database
      .prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)")
      .run(version, new Date().toISOString());
  });

  migrations.forEach((run, index) => {
    const version = index + 1;

    if (!applied.includes(version)) {
      applyMigration(version, run);
    }
  });
}

function openDatabase() {
  if (db) {
    return db;
  }

  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);

  console.log(`SQLite ready at ${dbPath}`);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error("Database has not been initialized. Call openDatabase() first.");
  }

  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  openDatabase,
  getDb,
  closeDatabase,
  getDbPath,
};
