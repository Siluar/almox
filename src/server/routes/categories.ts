import { Router } from "express";
import { db } from "../db";
import { isNonEmptyString } from "../validate";

const router = Router();

router.get("/", (_req, res) => {
  const categories = db.prepare("SELECT * FROM categories ORDER BY name").all();
  res.json(categories);
});

router.post("/", (req, res) => {
  const { name } = req.body || {};
  if (!isNonEmptyString(name)) {
    res.status(400).json({ error: "Nome da categoria é obrigatório" });
    return;
  }

  try {
    const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name.trim());
    res.json({ id: info.lastInsertRowid, name: name.trim() });
  } catch (err: any) {
    const message = String(err?.message || "");
    if (message.includes("UNIQUE")) {
      res.status(409).json({ error: "Já existe uma categoria com esse nome" });
      return;
    }
    res.status(400).json({ error: message });
  }
});

router.put("/:id", (req, res) => {
  const { name } = req.body || {};
  if (!isNonEmptyString(name)) {
    res.status(400).json({ error: "Nome da categoria é obrigatório" });
    return;
  }

  try {
    db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name.trim(), req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    const message = String(err?.message || "");
    if (message.includes("UNIQUE")) {
      res.status(409).json({ error: "Já existe uma categoria com esse nome" });
      return;
    }
    res.status(400).json({ error: message });
  }
});

router.delete("/:id", (req, res) => {
  const subCount = (db.prepare("SELECT COUNT(*) as count FROM subcategories WHERE category_id = ?").get(req.params.id) as { count: number }).count;

  if (subCount > 0) {
    res.status(409).json({ error: "Categoria possui subcategorias vinculadas. Exclua-as antes." });
    return;
  }

  try {
    db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;