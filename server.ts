import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("freshfocus.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    expiry_date TEXT,
    status TEXT DEFAULT 'fresh',
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get("/api/inventory", (req, res) => {
    const items = db.prepare("SELECT * FROM inventory ORDER BY expiry_date ASC").all();
    res.json(items);
  });

  // Serve input files from root
  app.get('/input_file_0.png', (req, res) => res.sendFile(path.resolve('input_file_0.png')));
  app.get('/input_file_1.png', (req, res) => res.sendFile(path.resolve('input_file_1.png')));
  app.get('/input_file_2.png', (req, res) => res.sendFile(path.resolve('input_file_2.png')));

  app.post("/api/inventory", (req, res) => {
    const { name, category, expiry_date, status, image_url } = req.body;
    const info = db.prepare(
      "INSERT INTO inventory (name, category, expiry_date, status, image_url) VALUES (?, ?, ?, ?, ?)"
    ).run(name, category, expiry_date, status, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/inventory/:id", (req, res) => {
    db.prepare("DELETE FROM inventory WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Freshly Server running on http://localhost:${PORT}`);
  });
}

startServer();
