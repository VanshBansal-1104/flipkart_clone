import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { sendOrderConfirmationEmail } from "./email.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");

// Render/hosting injects process.env; a local .env is optional. Second line fills missing keys from repo root.
dotenv.config();
dotenv.config({ path: path.join(REPO_ROOT, ".env") });

const PORT = Number(process.env.PORT) || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";
const isProd = process.env.NODE_ENV === "production";
const DIST_DIR = path.join(REPO_ROOT, "dist");

/** Supports Railway/Render-style DB_* names as well as MYSQL_*. */
const MYSQL_HOST = process.env.MYSQL_HOST || process.env.DB_HOST || "localhost";
const MYSQL_USER = process.env.MYSQL_USER || process.env.DB_USER || "root";
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD ?? process.env.DB_PASSWORD ?? "";
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || process.env.DB_NAME || "flipkart_clone";
const MYSQL_PORT = Number(process.env.MYSQL_PORT) || 3306;

if (isProd && (MYSQL_HOST === "localhost" || MYSQL_HOST === "127.0.0.1")) {
  console.warn(
    "[config] MYSQL_HOST is localhost — use your managed database hostname in production (not localhost).",
  );
}

/** @type {import('mysql2/promise').Pool} */
let pool;

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    req.user = jwt.verify(h.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/** JWT `sub` may be string or number — MySQL user id must match */
function userIdFromJwt(req) {
  const v = req.user?.sub;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

function optionalAuth(req) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(h.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

function parseSavedAddress(row) {
  const raw = row.saved_address;
  if (raw == null) return null;
  let p;
  if (Buffer.isBuffer(raw)) {
    try {
      p = JSON.parse(raw.toString("utf8"));
    } catch {
      return null;
    }
  } else if (typeof raw === "string") {
    try {
      p = JSON.parse(raw);
    } catch {
      return null;
    }
  } else if (typeof raw === "object") {
    p = raw;
  } else {
    return null;
  }
  if (p?.fullName && p?.phone && p?.pincode && p?.address && p?.city && p?.state) return p;
  return null;
}

function userRowToApi(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    savedAddress: parseSavedAddress(row),
  };
}

function slugify(name) {
  const s = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return s.slice(0, 128) || "category";
}

function rowToProduct(row) {
  const images = typeof row.images === "string" ? JSON.parse(row.images) : row.images;
  const specifications = typeof row.specifications === "string" ? JSON.parse(row.specifications) : row.specifications;
  const highlights = typeof row.highlights === "string" ? JSON.parse(row.highlights) : row.highlights;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    originalPrice: row.original_price,
    discount: row.discount,
    rating: Number(row.rating),
    ratingCount: row.rating_count,
    category: row.category_name,
    brand: row.brand,
    images,
    specifications,
    highlights,
    inStock: Boolean(row.in_stock),
  };
}

async function initDb() {
  const conn = await mysql.createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    port: MYSQL_PORT,
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\``);
  await conn.end();

  pool = mysql.createPool({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    port: MYSQL_PORT,
    waitForConnections: true,
    connectionLimit: 10,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await pool.query("ALTER TABLE users ADD COLUMN saved_address JSON NULL");
  } catch (e) {
    if (e.code !== "ER_DUP_FIELDNAME" && e.errno !== 1060) throw e;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(128) NOT NULL UNIQUE,
      slug VARCHAR(128) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      category_id INT UNSIGNED NOT NULL,
      name VARCHAR(512) NOT NULL,
      description TEXT,
      price INT NOT NULL,
      original_price INT NOT NULL,
      discount INT NOT NULL DEFAULT 0,
      rating DECIMAL(3,2) NOT NULL,
      rating_count INT NOT NULL DEFAULT 0,
      brand VARCHAR(128) NOT NULL,
      images JSON NOT NULL,
      specifications JSON NOT NULL,
      highlights JSON NOT NULL,
      in_stock TINYINT(1) NOT NULL DEFAULT 1,
      stock_quantity INT NOT NULL DEFAULT 99,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      public_id VARCHAR(32) NOT NULL UNIQUE,
      user_id INT UNSIGNED NULL,
      total_amount INT NOT NULL,
      shipping_address JSON NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'PLACED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      order_id INT UNSIGNED NOT NULL,
      product_id VARCHAR(36) NOT NULL,
      quantity INT NOT NULL,
      unit_price INT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [cnt] = await pool.query("SELECT COUNT(*) AS c FROM products");
  if (cnt[0].c === 0) {
    const seedPath = path.join(__dirname, "seed-products.json");
    const raw = readFileSync(seedPath, "utf8");
    const seed = JSON.parse(raw);
    const catNames = [...new Set(seed.map((p) => p.category))];
    const catMap = new Map();
    for (const name of catNames) {
      const slug = slugify(name);
      await pool.query(
        "INSERT IGNORE INTO categories (name, slug) VALUES (?, ?)",
        [name, slug],
      );
      const [rows] = await pool.query("SELECT id FROM categories WHERE name = ?", [name]);
      catMap.set(name, rows[0].id);
    }
    for (const p of seed) {
      const categoryId = catMap.get(p.category);
      await pool.query(
        `INSERT INTO products (
          id, category_id, name, description, price, original_price, discount,
          rating, rating_count, brand, images, specifications, highlights, in_stock, stock_quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          categoryId,
          p.name,
          p.description,
          p.price,
          p.originalPrice,
          p.discount,
          p.rating,
          p.ratingCount,
          p.brand,
          JSON.stringify(p.images),
          JSON.stringify(p.specifications),
          JSON.stringify(p.highlights),
          p.inStock ? 1 : 0,
          99,
        ],
      );
    }
    console.log(`Seeded ${seed.length} products and ${catNames.length} categories.`);
  }
}

const app = express();
if (isProd) app.set("trust proxy", 1);

const corsOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors(
    corsOrigins.length
      ? { origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins, credentials: true }
      : { origin: true, credentials: true },
  ),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/categories", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, slug FROM categories ORDER BY name");
    res.json({ categories: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : "";
    const category = req.query.category ? String(req.query.category).trim() : "";

    let sql = `
      SELECT p.*, c.name AS category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE 1=1
    `;
    const params = [];
    if (category) {
      sql += " AND c.name = ?";
      params.push(category);
    }
    if (search) {
      sql += " AND (p.name LIKE ? OR p.brand LIKE ?)";
      const q = `%${search}%`;
      params.push(q, q);
    }
    sql += " ORDER BY p.name";

    const [rows] = await pool.query(sql, params);
    res.json({ products: rows.map(rowToProduct) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
      [req.params.id],
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ product: rowToProduct(rows[0]) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load product" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const hash = await bcrypt.hash(password, 10);
    const normalized = String(email).trim().toLowerCase();
    await pool.query("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)", [
      normalized,
      hash,
      name ? String(name).trim() : null,
    ]);
    const [rows] = await pool.query(
      "SELECT id, email, name, saved_address FROM users WHERE email = ?",
      [normalized],
    );
    const user = rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user: userRowToApi(user) });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.error(e);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const normalized = String(email).trim().toLowerCase();
    const [rows] = await pool.query(
      "SELECT id, email, name, password_hash, saved_address FROM users WHERE email = ?",
      [normalized],
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = signToken({ id: user.id, email: user.email });
    res.json({
      token,
      user: userRowToApi(user),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const uid = userIdFromJwt(req);
    if (uid == null) return res.status(401).json({ error: "Invalid token" });
    const [rows] = await pool.query(
      "SELECT id, email, name, saved_address FROM users WHERE id = ?",
      [uid],
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: userRowToApi(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed" });
  }
});

app.put("/api/auth/me/address", authMiddleware, async (req, res) => {
  try {
    const uid = userIdFromJwt(req);
    if (uid == null) return res.status(401).json({ error: "Invalid token" });
    const body = req.body;
    if (
      !body?.fullName ||
      !body?.phone ||
      !body?.pincode ||
      !body?.address ||
      !body?.city ||
      !body?.state
    ) {
      return res.status(400).json({ error: "Complete address required" });
    }
    const phone = String(body.phone).replace(/\D/g, "");
    const pin = String(body.pincode).replace(/\D/g, "");
    if (phone.length !== 10 || pin.length !== 6) {
      return res.status(400).json({ error: "Invalid phone or pincode" });
    }
    const normalized = {
      fullName: String(body.fullName).trim(),
      phone,
      pincode: pin,
      address: String(body.address).trim(),
      city: String(body.city).trim(),
      state: String(body.state).trim(),
    };
    await pool.query("UPDATE users SET saved_address = ? WHERE id = ?", [
      JSON.stringify(normalized),
      uid,
    ]);
    const [rows] = await pool.query(
      "SELECT id, email, name, saved_address FROM users WHERE id = ?",
      [uid],
    );
    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: userRowToApi(row) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to save address" });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const payload = optionalAuth(req);
    const userId =
      payload?.sub != null && Number.isFinite(Number(payload.sub)) ? Number(payload.sub) : null;

    const { items, address, notifyEmail } = req.body;
    if (!items?.length || !address?.fullName || !address?.phone || !address?.pincode || !address?.address || !address?.city || !address?.state) {
      return res.status(400).json({ error: "Invalid order payload" });
    }

    // ✅ FIX 1: Batch fetch ALL products in ONE query instead of N separate queries
    const productIds = items.map((i) => i.productId);
    const [prows] = await pool.query(
      "SELECT id, price, in_stock, stock_quantity FROM products WHERE id IN (?)",
      [productIds],
    );
    const productMap = new Map(prows.map((p) => [p.id, p]));

    let total = 0;
    const lines = [];
    for (const line of items) {
      const pid = line.productId;
      const qty = Number(line.quantity);
      if (!pid || !qty || qty < 1) {
        return res.status(400).json({ error: "Invalid line item" });
      }
      const pr = productMap.get(pid);
      if (!pr || !pr.in_stock) {
        return res.status(400).json({ error: `Product unavailable: ${pid}` });
      }
      if (pr.stock_quantity < qty) {
        return res.status(400).json({ error: `Insufficient stock for ${pid}` });
      }
      total += pr.price * qty;
      lines.push({ productId: pid, quantity: qty, unitPrice: pr.price });
    }

    const publicId = `OD${Date.now().toString(36).toUpperCase()}`;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [orderResult] = await conn.query(
        "INSERT INTO orders (public_id, user_id, total_amount, shipping_address, status) VALUES (?, ?, ?, ?, 'PLACED')",
        [publicId, userId, total, JSON.stringify(address)],
      );
      const orderDbId = orderResult.insertId;
      for (const line of lines) {
        await conn.query(
          "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
          [orderDbId, line.productId, line.quantity, line.unitPrice],
        );
        await conn.query(
          "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
          [line.quantity, line.productId],
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    // ✅ FIX 2: Also check address.email so guest customers get confirmations
    const emailTo = notifyEmail || address?.email || payload?.email || null;

    const totalFormatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(total);

    // ✅ FIX 3: Respond IMMEDIATELY — don't make user wait for SMTP
    res.status(201).json({ orderId: publicId, total });

    // Email sends in background after response is already sent to client
    sendOrderConfirmationEmail(emailTo, {
      orderId: publicId,
      totalFormatted,
      itemCount: items.reduce((s, i) => s + Number(i.quantity), 0),
    }).catch((err) => console.error("Order confirmation email failed:", err?.message || err));

  } catch (e) {
    console.error(e);
    const detail =
      process.env.NODE_ENV !== "production" ? String(e.message || e) : "Order failed";
    res.status(500).json({ error: detail });
  }
});

app.get("/api/orders", authMiddleware, async (req, res) => {
  try {
    const uid = userIdFromJwt(req);
    if (uid == null) return res.status(401).json({ error: "Invalid token" });
    const [orders] = await pool.query(
      `SELECT id, public_id, total_amount, shipping_address, created_at
       FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [uid],
    );

    const out = [];
    for (const o of orders) {
      const [items] = await pool.query(
        `SELECT oi.product_id, oi.quantity, oi.unit_price, p.name, p.images
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`,
        [o.id],
      );
      const shipping =
        typeof o.shipping_address === "string" ? JSON.parse(o.shipping_address) : o.shipping_address;
      out.push({
        id: o.public_id,
        total: o.total_amount,
        date: o.created_at,
        address: shipping,
        items: items.map((it) => ({
          product: {
            id: it.product_id,
            name: it.name,
            price: it.unit_price,
            images: typeof it.images === "string" ? JSON.parse(it.images) : it.images,
          },
          quantity: it.quantity,
        })),
      });
    }
    res.json({ orders: out });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

const serveStatic =
  isProd && existsSync(DIST_DIR) && process.env.SERVE_STATIC !== "0" && process.env.API_ONLY !== "1";
if (serveStatic) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
} else if (isProd) {
  console.warn(
    "Production API-only (no dist/ or SERVE_STATIC=0 / API_ONLY=1) — use with a separate static host (e.g. Vercel) + VITE_API_URL.",
  );
}

async function start() {
  try {
    if (isProd && (!JWT_SECRET || JWT_SECRET === "dev-only-change-me")) {
      console.error("Set JWT_SECRET to a long random value in production.");
      process.exit(1);
    }
    await initDb();
    if (isProd) {
      const host = process.env.HOST || "0.0.0.0";
      await new Promise((resolve, reject) => {
        const srv = app.listen(PORT, host, () => resolve(srv));
        srv.on("error", reject);
      });
      console.log(`Listening on http://${host}:${PORT} — UI + API (production, fixed PORT)`);
      return;
    }
    /** Dev only: try next ports if PORT is busy so Vite + api can run locally. Not used in production. */
    const portFile = path.join(REPO_ROOT, "api-port.txt");
    const basePort = PORT;
    const maxAttempts = 20;
    let chosenPort = basePort;
    for (let i = 0; i < maxAttempts; i++) {
      const port = basePort + i;
      try {
        await new Promise((resolve, reject) => {
          const srv = app.listen(port, () => resolve(srv));
          srv.on("error", reject);
        });
        chosenPort = port;
        break;
      } catch (err) {
        if (err?.code !== "EADDRINUSE" || i === maxAttempts - 1) {
          if (err?.code === "EADDRINUSE") {
            console.error(
              `\nNo free port in range ${basePort}–${basePort + maxAttempts - 1}. Stop other Node processes or set PORT in .env.`,
            );
          }
          throw err;
        }
      }
    }
    writeFileSync(portFile, String(chosenPort), "utf8");
    if (chosenPort !== basePort) {
      console.log(
        `Note: preferred port ${basePort} was busy. API on ${chosenPort} (saved to api-port.txt for Vite).`,
      );
    }
    console.log(`API listening at http://localhost:${chosenPort}`);
  } catch (e) {
    console.error("Failed to start API:", e.message);
    console.error("Check MySQL is running and MYSQL_* values in .env are correct.");
    process.exit(1);
  }
}

start();
