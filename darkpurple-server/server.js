import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- Admin login ---
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query(
    "SELECT * FROM admin WHERE username=$1 AND password=$2",
    [username, password]
  );
  if (result.rows.length === 0) return res.status(401).json({ error: "Неверные данные" });
  res.json({ success: true });
});

// --- Programs ---
app.get("/api/programs", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM programs ORDER BY created_at DESC");
  res.json(rows);
});

app.post("/api/programs", async (req, res) => {
  const { name, description, version, image, download_link } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO programs (name, description, version, image, download_link)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, description, version, image, download_link]
  );
  res.json(rows[0]);
});

// --- Download counter ---
app.post("/api/programs/:id/download", async (req, res) => {
  await pool.query("UPDATE programs SET downloads = downloads + 1 WHERE id=$1", [req.params.id]);
  res.json({ success:true });
});

// --- Reviews ---
app.get("/api/programs/:id/reviews", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM reviews WHERE program_id=$1 ORDER BY created_at DESC",
    [req.params.id]
  );
  res.json(rows);
});

app.post("/api/programs/:id/reviews", async (req, res) => {
  const { rating, comment } = req.body;
  await pool.query(
    "INSERT INTO reviews (program_id,rating,comment) VALUES ($1,$2,$3)",
    [req.params.id, rating, comment]
  );
  res.json({ success:true });
});

app.listen(PORT, ()=>console.log("Server running on port", PORT));
