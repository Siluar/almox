import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

import { initDb } from "./src/server/db";
import { startBackupSchedule } from "./src/server/backup";
import { authRouter, requireAuth, isDefaultAccessCode } from "./src/server/auth";
import statsRouter from "./src/server/routes/stats";
import categoriesRouter from "./src/server/routes/categories";
import subcategoriesRouter from "./src/server/routes/subcategories";
import itemsRouter from "./src/server/routes/items";
import movementsRouter from "./src/server/routes/movements";
import reportsRouter from "./src/server/routes/reports";
import configRouter from "./src/server/routes/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initDb();
startBackupSchedule();

if (isDefaultAccessCode()) {
  console.warn("[segurança] Usando código de acesso padrão. Defina ACCESS_CODE e SESSION_SECRET no arquivo .env");
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check (public)
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Authentication
  app.use("/api/auth", authRouter);

  // Everything below requires a valid token
  app.use("/api", requireAuth);

  app.use("/api/stats", statsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/subcategories", subcategoriesRouter);
  app.use("/api/items", itemsRouter);
  app.use("/api/movements", movementsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api", configRouter);

  // API 404 handler
  app.use("/api", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();