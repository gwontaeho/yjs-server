const sqlite3 = require("sqlite3").verbose();
const Y = require("yjs");

const db = new sqlite3.Database("./src/database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS documents (
    name TEXT PRIMARY KEY,
    data BLOB
  )
`);

function loadDoc(name) {
  return new Promise((resolve, reject) => {
    db.get("SELECT data FROM documents WHERE name = ?", [name], (err, row) => {
      const doc = new Y.Doc();
      if (err) return reject(err);
      if (row?.data) {
        try {
          Y.applyUpdate(doc, row.data);
        } catch (e) {
          console.warn(`error:`, e.message);
        }
      }
      resolve(doc);
    });
  });
}

function saveDoc(name, doc) {
  const update = Y.encodeStateAsUpdate(doc);
  db.run(
    `INSERT INTO documents (name, data)
     VALUES (?, ?)
     ON CONFLICT(name) DO UPDATE SET data = excluded.data`,
    [name, update]
  );
}

module.exports = { loadDoc, saveDoc };
