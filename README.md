# Flipkart Clone

A full-stack e-commerce demo inspired by Flipkart: React storefront, Express REST API, MySQL data store, JWT authentication, checkout with stock updates, and optional order-confirmation email (Gmail SMTP or Ethereal in development).

| Item | Details |
|------|---------|
| **License** | MIT — see [`LICENSE`](./LICENSE) |
| **Node.js** | `>= 18.0.0` |
| **Package name** (`package.json`) | `vite_react_shadcn_ts` (internal); treat this repo as **Flipkart Clone** |

---

## Table of contents

1. [Features](#features)  
2. [Tech stack](#tech-stack)  
3. [Repository layout](#repository-layout)  
4. [Prerequisites](#prerequisites)  
5. [Installation](#installation)  
6. [Environment variables](#environment-variables)  
7. [Database](#database)  
8. [Running the app](#running-the-app)  
9. [Development details](#development-details)  
10. [Production build & deploy](#production-build--deploy)  
11. [REST API reference](#rest-api-reference)  
12. [Order confirmation email](#order-confirmation-email)  
13. [Frontend routes](#frontend-routes)  
14. [NPM scripts](#npm-scripts)  
15. [Testing](#testing)  
16. [Troubleshooting](#troubleshooting)  
17. [Security notes](#security-notes)  

---

## Features

- **Product catalog** — Browse/search products; category filter; product detail pages with images, specs, and ratings (UI).  
- **Cart & checkout** — Multi-step checkout (address → summary → payment), cart persisted in `localStorage`, quantities with stock checks on the server.  
- **Orders** — Place order API creates `orders` / `order_items`, decrements `stock_quantity`, returns public order id (e.g. `OD…`).  
- **Authentication** — Register / login with bcrypt-hashed passwords; JWT (`Bearer`) for protected routes; profile and saved shipping address.  
- **Wishlist** — Client-side wishlist persisted in `localStorage`.  
- **Order history** — Logged-in users can list orders linked to their account.  
- **Email** — Optional SMTP (Gmail recommended) or Ethereal test inbox in development.  
- **Responsive UI** — Tailwind CSS, shadcn-style Radix components, Flipkart-like orange/blue accents.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite 5, React Router 6, TanStack Query, Zustand, Tailwind CSS, Radix UI, Sonner toasts |
| Backend | Express 4, `mysql2` (promise pool), `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`, `nodemailer` |
| Database | MySQL 8+ compatible (InnoDB, `utf8mb4`) |
| Tooling | ESLint 9, Vitest + Testing Library + jsdom, `concurrently` for dev |

---

## Repository layout

```
flipkart_clone-main/
├── public/                 # Static assets (robots.txt, placeholders)
├── server/
│   ├── index.js            # Express app, DB bootstrap, REST routes
│   ├── email.js            # Order confirmation mail (SMTP / Ethereal)
│   └── seed-products.json  # Initial product seed (loaded when DB empty)
├── src/
│   ├── App.tsx             # Routes, providers, auth hydration
│   ├── components/         # Header, Footer, product UI, shadcn UI kit
│   ├── data/products.ts    # Product definitions (also source for gen:seed)
│   ├── hooks/
│   ├── lib/                # apiBase, authApi, ordersApi, checkout helpers
│   ├── pages/              # Index, Product, Cart, Checkout, Login, etc.
│   ├── store/              # Zustand cart/wishlist/orders + auth persist
│   └── test/setup.ts       # Vitest + jest-dom setup
├── index.html
├── vite.config.ts          # Dev server :8080, dynamic /api → Express proxy
├── vitest.config.ts
├── package.json
├── .env.example            # Copy to .env and fill in secrets
└── LICENSE
```

---

## Prerequisites

- **Node.js** 18 or newer (`node -v`).  
- **MySQL** server reachable from your machine (local install, Docker, or cloud host).  
- **npm** (ships with Node). This project uses **`package-lock.json`** — use `npm install`, not Bun-only workflows.

---

## Installation

```bash
git clone <your-repo-url>
cd flipkart_clone-main
npm install
```

Copy environment template and edit values:

```bash
copy .env.example .env
# On macOS/Linux: cp .env.example .env
```

Ensure MySQL is running and credentials in `.env` match your instance.

```bash
npm run dev
```

---

## Environment variables

The API loads `.env` from the **project root** (same folder as `package.json`). Vite also reads `.env` for `VITE_*` keys at build time.

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MYSQL_HOST` | No | `localhost` | MySQL host. Alias: `DB_HOST`. |
| `MYSQL_PORT` | No | `3306` | MySQL port. |
| `MYSQL_USER` | No | `root` | MySQL user. Alias: `DB_USER`. |
| `MYSQL_PASSWORD` | No | *(empty)* | MySQL password. Alias: `DB_PASSWORD`. |
| `MYSQL_DATABASE` | No | `flipkart_clone` | Database name (created if missing). Alias: `DB_NAME`. |

### API & auth

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | API listen port. In development the server may increment if busy and writes **`api-port.txt`** for Vite’s proxy. |
| `JWT_SECRET` | **Yes in production** | `dev-only-change-me` | Secret for signing JWTs — **must** be a long random string in production. |
| `NODE_ENV` | No | — | Set to `production` for production behaviour (stricter checks, static `dist` serving). |
| `HOST` | No | `0.0.0.0` (prod listen) | Bind host in production. |

### CORS (split frontend + API)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ORIGIN` | No | *(reflect / allow)* | Comma-separated allowed origins. Alias: `FRONTEND_URL`. |
| `VITE_API_URL` | For split deploy | *(empty)* | Full API origin **without** trailing slash, e.g. `https://api.example.com`. Browser calls `${VITE_API_URL}/api/...`. |

### Frontend build

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BASE` | No | `/` | Vite `base` path for subpath deployments. |

### Static files (production)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SERVE_STATIC` | No | — | Set to `0` to disable serving `dist/` from Express. |
| `API_ONLY` | No | — | Set to `1` to run API only (no SPA). |

### Order email (SMTP)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | For real mail | — | e.g. `smtp.gmail.com`. Inferred for `@gmail.com` users if omitted. |
| `SMTP_PORT` | No | `587` | Use `465` for implicit TLS if your provider requires it. |
| `SMTP_USER` | Gmail / auth | — | SMTP login. Alias: `EMAIL_USER`. |
| `SMTP_PASS` | Gmail / auth | — | App password or SMTP password. Spaces stripped. Alias: `EMAIL_PASS`. |
| `MAIL_FROM` | For `hasSmtp` | falls back to `SMTP_USER` | `From` address (should match authenticated mailbox for Gmail). |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | No | `true` | Set to `false` only for local/dev MITM debugging (not recommended). |

---

## Database

- On startup, the API **creates the database** (if needed) and **creates/updates tables**: `users`, `categories`, `products`, `orders`, `order_items`.  
- If the `products` table is **empty**, it seeds from **`server/seed-products.json`**.  
- To regenerate seed JSON from TypeScript product data:

  ```bash
  npm run gen:seed
  ```

No separate SQL migration runner is required for normal use.

---

## Running the app

### Development (recommended)

```bash
npm run dev
```

This runs **two processes**:

| Process | Role | Default URL |
|---------|------|-------------|
| **client** | Vite dev server | **http://localhost:8080** (or next free port) |
| **api** | Express API | **http://localhost:3001** (or `PORT` / fallback; see `api-port.txt`) |

The Vite dev server **proxies** requests starting with `/api` to the Express port (read from `api-port.txt` when present). The browser can use **relative** URLs such as `/api/health`.

**Health check:** open `http://localhost:8080/api/health` — expect `{"ok":true}`.

### API or client only

```bash
npm run dev:api    # node server/index.js
npm run dev:client # vite only — ensure API is running for /api routes
```

---

## Development details

- **Client state:** Cart, wishlist, and a local copy of orders use **`localStorage`** (see `useStore`). Auth token + user use **`zustand/persist`** key `fk-auth-storage`.  
- **Checkout address:** Guest address can live in `localStorage`; logged-in users can sync address to **`PUT /api/auth/me/address`**.  
- **API port file:** If port `3001` is in use, the API tries the next ports and writes the chosen value to **`api-port.txt`** so Vite’s proxy stays correct. The file is gitignored.

---

## Production build & deploy

### Single Node process (API + static UI)

```bash
npm run build
npm start
```

- Sets `NODE_ENV=production` (via `cross-env` on Windows).  
- Serves **`dist/`** from Express when `dist` exists and `SERVE_STATIC` is not `0` and `API_ONLY` is not `1`.  
- **Requirements:** strong `JWT_SECRET`, real `MYSQL_*` host (not `localhost` on PaaS unless DB is on same network), and optional `CORS_ORIGIN` / `FRONTEND_URL` if the UI is on another origin.

### Split hosting (e.g. static on Vercel, API on Render)

1. Deploy the **API** with `npm start` (or `node server/index.js`), env vars for DB + `JWT_SECRET` + CORS.  
2. Build the **frontend** with `VITE_API_URL=https://your-api-host` so `fetch` targets the remote API.  
3. Do **not** rely on Vite’s dev proxy in production; the built app uses `apiUrl()` from `src/lib/apiBase.ts`.

---

## REST API reference

Base path: **`/api`**. JSON request/response unless noted.

### `GET /api/health`

- **Auth:** none  
- **200:** `{ "ok": true }`

### `GET /api/categories`

- **Auth:** none  
- **200:** `{ "categories": [ { "id", "name", "slug" }, ... ] }`

### `GET /api/products`

- **Auth:** none  
- **Query:** `search` (optional), `category` (optional, matches category **name**)  
- **200:** `{ "products": [ /* product objects */ ] }`

### `GET /api/products/:id`

- **Auth:** none  
- **200:** `{ "product": { ... } }`  
- **404:** `{ "error": "Product not found" }`

### `POST /api/auth/register`

- **Body:** `{ "email", "password", "name"? }` — password minimum length **6**.  
- **201:** `{ "token", "user": { "id", "email", "name", "savedAddress" } }`  
- **409:** email already exists  

### `POST /api/auth/login`

- **Body:** `{ "email", "password" }`  
- **200:** `{ "token", "user": ... }`  
- **401:** invalid credentials  

### `GET /api/auth/me`

- **Auth:** `Authorization: Bearer <jwt>`  
- **200:** `{ "user": ... }`  

### `PUT /api/auth/me/address`

- **Auth:** Bearer  
- **Body:** `{ "fullName", "phone", "pincode", "address", "city", "state" }` — phone 10 digits, pincode 6 digits (normalized server-side).  
- **200:** `{ "user": ... }`  

### `POST /api/orders`

- **Auth:** optional Bearer (links order to user when present)  
- **Body:**

  ```json
  {
    "items": [{ "productId": "<uuid>", "quantity": 1 }],
    "address": {
      "fullName": "",
      "phone": "",
      "pincode": "",
      "address": "",
      "city": "",
      "state": "",
      "email": ""
    },
    "notifyEmail": "optional@override.com"
  }
  ```

  `address.email` is optional; used as a fallback recipient for confirmation email when not logged in.

- **201:** `{ "orderId": "OD…", "total": <number> }` — `total` is an integer sum of line **unit prices × quantities** (rupee amounts as stored in DB).  
- **400:** validation / stock / product errors  
- **500:** server error  

Email sends **after** the HTTP response (non-blocking).

### `GET /api/orders`

- **Auth:** Bearer  
- **200:** `{ "orders": [ { "id", "total", "date", "address", "items" }, ... ] }`

---

## Order confirmation email

| Mode | Behaviour |
|------|-----------|
| **SMTP configured** (`SMTP_HOST` + `MAIL_FROM` + password when required) | Sends real mail via Nodemailer. **Gmail:** use **App Password** with 2-Step Verification; password may include spaces — server normalizes. Uses `service: 'gmail'` when applicable. |
| **Development, SMTP not set** | Uses **Ethereal** fake SMTP; the API logs a **preview URL** — mail does **not** go to a real inbox. |
| **Production, SMTP not set** | Email is **skipped**; warning logged. |

Errors while sending are logged; **they do not fail the order** once `201` is returned.

---

## Frontend routes

| Path | Page |
|------|------|
| `/` | Home / product grid |
| `/product/:id` | Product detail |
| `/cart` | Cart |
| `/checkout` | Checkout (steps via `?step=address|summary|payment`) |
| `/order-confirmation/:orderId` | Thank-you / confirmation |
| `/login` | Login / register |
| `/profile` | Profile |
| `/orders` | Order history (authenticated) |
| `/wishlist` | Wishlist |
| `*` | Not found |

---

## NPM scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `concurrently` Vite + API | Full local stack |
| `dev:client` | `vite` | Frontend only |
| `dev:api` | `node server/index.js` | API only |
| `build` | `vite build` | Production client bundle → `dist/` |
| `start` | `NODE_ENV=production node server/index.js` | Production API (+ static if configured) |
| `preview` | `vite preview` | Preview production build locally |
| `lint` | `eslint .` | Lint |
| `test` | `vitest run` | Unit tests once |
| `test:watch` | `vitest` | Watch mode |
| `gen:seed` | `tsx` one-liner | Regenerate `server/seed-products.json` from `src/data/products.ts` |

---

## Testing

- Framework: **Vitest** with **jsdom** and **`src/test/setup.ts`**.  
- Test globs: `src/**/*.{test,spec}.{ts,tsx}`.  
- Run: `npm run test`.

Add new tests beside components or under `src/__tests__` using the `.test.ts` / `.spec.tsx` suffix.

---

## Troubleshooting

| Symptom | What to check |
|--------|----------------|
| `502` on `/api/*` in dev | API not running; port mismatch — restart `npm run dev` or inspect `api-port.txt`. |
| `Could not resolve` / connection refused | MySQL host/port/user/password in `.env`; firewall; managed DB SSL (this stack uses basic `mysql2` pool — adjust if your cloud requires SSL options). |
| CORS errors in production | Set `CORS_ORIGIN` or `FRONTEND_URL` to your SPA origin(s). |
| No order email | `.env` SMTP vars; Gmail App Password; dev mode uses Ethereal — read API logs for preview link. |
| `JWT_SECRET` error on start in prod | Set a long random `JWT_SECRET` — default is rejected when `NODE_ENV=production`. |
| Empty product list | Run once with DB up so seed runs; or run `npm run gen:seed` and restart with empty `products` if you need to re-seed manually. |

---

## Security notes

- Replace default **`JWT_SECRET`** and use **HTTPS** in production.  
- Never commit **`.env`** (only **`.env.example`** without secrets).  
- Passwords are hashed with **bcrypt**; JWTs expire per server config (`7d` in code — verify in `server/index.js` if you change it).  
- Order totals and stock are **validated on the server**; client prices are for display only.

---

## Author & license

Copyright (c) 2026 Vansh Bansal. Released under the **MIT License** — see [`LICENSE`](./LICENSE).

---

## Contributing / support

Issues and pull requests are welcome. When reporting bugs, include **Node version**, **OS**, relevant **`.env` keys (redacted)**, and **API log snippets** without passwords or JWTs.

