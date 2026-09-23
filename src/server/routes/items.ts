import { Router } from "express";
import { db } from "../db";
import { isNonEmptyString, isNonNegativeNumber, optionalString, toId } from "../validate";

const router = Router();

const ITEM_SELECT = `
  SELECT i.*, s.name as subcategory_name, c.name as category_name, c.id as category_id
  FROM items i
  JOIN subcategories s ON i.subcategory_id = s.id
  JOIN categories c ON s.category_id = c.id
`;

function sanitizeUnit(value: unknown): string {
  if (typeof value !== "string") return "un";
  const unit = value.trim().slice(0, 10);
  return unit === "" ? "un" : unit;
}

router.get("/", (_req, res) => {
  const items = db.prepare(`${ITEM_SELECT} ORDER BY i.name`).all();
  res.json(items);
});

router.get("/:id", (req, res) => {
  const item = db.prepare(`${ITEM_SELECT} WHERE i.id = ?`).get(req.params.id);
  if (!item) {
    res.status(404).json({ error: "Item não encontrado" });
    return;
  }
  res.json(item);
});

router.post("/", (req, res) => {
  const { name, description, subcategory_id, unit, initial_stock, min_stock } = req.body || {};

  if (!isNonEmptyString(name)) {
    res.status(400).json({ error: "Nome do item é obrigatório" });
    return;
  }
  const subcategoryId = toId(subcategory_id);
  if (!subcategoryId) {
    res.status(400).json({ error: "Subcategoria inválida" });
    return;
  }
  const subcategory = db.prepare("SELECT id FROM subcategories WHERE id = ?").get(subcategoryId);
  if (!subcategory) {
    res.status(400).json({ error: "Subcategoria não encontrada" });
    return;
  }

  const initialStock = isNonNegativeNumber(initial_stock) ? Number(initial_stock) : 0;
  const minStock = isNonNegativeNumber(min_stock) ? Number(min_stock) : 0;
  const cleanUnit = sanitizeUnit(unit);

  const transaction = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO items (name, description, subcategory_id, current_stock, min_stock, unit)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), optionalString(description), subcategoryId, initialStock, minStock, cleanUnit);

    const itemId = Number(info.lastInsertRowid);

    if (initialStock > 0) {
      db.prepare(`
        INSERT INTO movements (item_id, type, quantity, notes)
        VALUES (?, 'entry', ?, 'Estoque inicial')
      `).run(itemId, initialStock);
    }

    return itemId;
  });

  try {
    const itemId = transaction();
    res.json({
      id: itemId,
      name: name.trim(),
      description: optionalString(description),
      subcategory_id: subcategoryId,
      unit: cleanUnit,
      current_stock: initialStock,
      min_stock: minStock
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", (req, res) => {
  const { name, description, subcategory_id, unit, min_stock } = req.body || {};

  if (!isNonEmptyString(name)) {
    res.status(400).json({ error: "Nome do item é obrigatório" });
    return;
  }
  const subcategoryId = toId(subcategory_id);
  if (!subcategoryId) {
    res.status(400).json({ error: "Subcategoria inválida" });
    return;
  }

  const minStock = isNonNegativeNumber(min_stock) ? Number(min_stock) : 0;
  const cleanUnit = sanitizeUnit(unit);

  try {
    const info = db.prepare(`
      UPDATE items
      SET name = ?, description = ?, subcategory_id = ?, unit = ?, min_stock = ?
      WHERE id = ?
    `).run(name.trim(), optionalString(description), subcategoryId, cleanUnit, minStock, req.params.id);

    if (info.changes === 0) {
      res.status(404).json({ error: "Item não encontrado" });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", (req, res) => {
  const item = db.prepare("SELECT id FROM items WHERE id = ?").get(req.params.id);
  if (!item) {
    res.status(404).json({ error: "Item não encontrado" });
    return;
  }

  const movementCount = (db.prepare("SELECT COUNT(*) as count FROM movements WHERE item_id = ?").get(req.params.id) as { count: number }).count;

  if (movementCount > 0) {
    res.status(409).json({ error: "Item possui movimentações registradas. Excluir apagaria o histórico." });
    return;
  }

  try {
    db.prepare("DELETE FROM items WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;