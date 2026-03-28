import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });

/** Prefer api-port.txt (written when the API binds) so Vite tracks fallback ports. */
function readApiPort(): string {
  const file = path.resolve(__dirname, "api-port.txt");
  try {
    if (existsSync(file)) {
      const p = readFileSync(file, "utf8").trim();
      if (/^\d+$/.test(p)) return p;
    }
  } catch {
    /* use fallback */
  }
  const fromEnv = process.env.PORT?.trim();
  if (fromEnv && /^\d+$/.test(fromEnv)) return fromEnv;
  return "3001";
}

/** Forwards /api to the Express server; port comes from api-port.txt (written on API start) or PORT. */
function apiProxyPlugin(): Plugin {
  return {
    name: "api-proxy-dynamic",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api")) {
          return next();
        }
        const port = readApiPort();
        const proxyReq = http.request(
          {
            hostname: "127.0.0.1",
            port: Number(port),
            path: url,
            method: req.method,
            headers: { ...req.headers, host: `127.0.0.1:${port}` },
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
            proxyRes.pipe(res);
          },
        );
        proxyReq.on("error", (err) => {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: `API unreachable on port ${port}: ${err.message}. Run npm run dev (or node server/index.js) so the API is listening.`,
            }),
          );
        });
        req.pipe(proxyReq);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [apiProxyPlugin(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
});
