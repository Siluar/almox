import { Router } from "express";
import { db } from "../db";
import { isNonEmptyString, toId } from "../validate";

const router = Router();

router.get("/", (_req, res) => {
  const subcategories = db.prepare(`
    SELECT s.*, c.name as category_name
    FROM subcategories s
    JOIN categories c ON s.category_id = c.id
    ORDER BY c.name, s.name
  `).all();
  res.json(subcategories);
});

router.post("/", (req, res) => {
  const { name, category_id } = req.body || {};
  const categoryId = toId(category_id);

  if (!isNonEmptyString(name)) {
    res.status(400).json({ error: "Nome da subcategoria é obrigatório" });
    return;
  }
  if (!categoryId) {
    res.status(400).json({ error: "Categoria inválida" });
    return;
  }
  const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId);
  if (!category) {
    res.status(400).json({ error: "Categoria não encontrada" });
    return;
  }

  try {
    const info = db.prepare("INSERT INTO subcategories (name, category_id) VALUES (?, ?)").run(name.trim(), categoryId);
    res.json({ id: info.lastInsertRowid, name: name.trim(), category_id: categoryId });
  } catch (err: any) {
    const message = String(err?.message || "");
    if (message.includes("UNIQUE")) {
      res.status(409).json({ error: "Já existe uma subcategoria com esse nome nesta categoria" });
      return;
    }
    res.status(400).json({ error: message });
  }
});

router.put("/:id", (req, res) => {
  const { name, category_id } = req.body || {};
  const categoryId = toId(category_id);

  if (!isNonEmptyString(name)) {
    res.status(400).json({ error: "Nome da subcategoria é obrigatório" });
    return;
  }
  if (!categoryId) {
    res.status(400).json({ error: "Categoria inválida" });
    return;
  }

  try {
    db.prepare("UPDATE subcategories SET name = ?, category_id = ? WHERE id = ?").run(name.trim(), categoryId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    const message = String(err?.message || "");
    if (message.includes("UNIQUE")) {
      res.status(409).json({ error: "Já existe uma subcategoria com esse nome nesta categoria" });
      return;
    }
    res.status(400).json({ error: message });
  }
});

router.delete("/:id", (req, res) => {
  const itemCount = (db.prepare("SELECT COUNT(*) as count FROM items WHERE subcategory_id = ?").get(req.params.id) as { count: number }).count;

  if (itemCount > 0) {
    res.status(409).json({ error: "Subcategoria possui itens vinculados. Exclua-os antes." });
    return;
  }

  try {
    db.prepare("DELETE FROM subcategories WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;