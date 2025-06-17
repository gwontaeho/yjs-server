const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const router = express.Router();
const db = new sqlite3.Database("./src/database.db");

router.get("/documents", (req, res) => {
  db.all("SELECT name FROM documents", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const names = rows.map((row) => row.name);
    res.json(names);
  });
});

router.delete("/documents/:name", (req, res) => {
  const { name } = req.params;
  db.run("DELETE FROM documents WHERE name = ?", [name], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({ success: true, message: `Deleted: ${name}` });
  });
});

module.exports = router;
