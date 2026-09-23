import { Router } from "express";
import { db } from "../db";
import { optionalString, toId } from "../validate";

const router = Router();

router.get("/", (_req, res) => {
  const movements = db.prepare(`
    SELECT m.*, i.name as item_name, i.description as item_description, i.unit, s.name as subcategory_name, c.name as category_name
    FROM movements m
    JOIN items i ON m.item_id = i.id
    JOIN subcategories s ON i.subcategory_id = s.id
    JOIN categories c ON s.category_id = c.id
    ORDER BY m.date DESC
  `).all();
  res.json(movements);
});

router.post("/", (req, res) => {
  const { item_id, type, quantity, notes } = req.body || {};

  const itemId = toId(item_id);
  if (!itemId) {
    res.status(400).json({ error: "Item inválido" });
    return;
  }
  if (type !== "entry" && type !== "exit") {
    res.status(400).json({ error: "Tipo de movimentação inválido (use 'entry' ou 'exit')" });
    return;
  }
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    res.status(400).json({ error: "Quantidade deve ser um número maior que zero" });
    return;
  }

  const item = db.prepare("SELECT id, current_stock FROM items WHERE id = ?").get(itemId) as { id: number; current_stock: number } | undefined;
  if (!item) {
    res.status(404).json({ error: "Item não encontrado" });
    return;
  }

  if (type === "exit" && Number(item.current_stock) + 0.0001 < qty) {
    res.status(400).json({ error: `Estoque insuficiente. Disponível: ${item.current_stock}` });
    return;
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO movements (item_id, type, quantity, notes)
      VALUES (?, ?, ?, ?)
    `).run(itemId, type, qty, optionalString(notes));

    const stockChange = type === "entry" ? qty : -qty;
    db.prepare("UPDATE items SET current_stock = current_stock + ? WHERE id = ?").run(stockChange, itemId);

    return db.prepare("SELECT current_stock FROM items WHERE id = ?").get(itemId) as { current_stock: number };
  });

  try {
    const result = transaction();
    res.json({ success: true, new_stock: result.current_stock });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", (req, res) => {
  const transaction = db.transaction(() => {
    const movement = db.prepare("SELECT * FROM movements WHERE id = ?").get(req.params.id) as { id: number; type: "entry" | "exit"; quantity: number; item_id: number } | undefined;
    if (!movement) throw new Error("Movimentação não encontrada");

    const stockChange = movement.type === "entry" ? -movement.quantity : movement.quantity;
    db.prepare("UPDATE items SET current_stock = current_stock + ? WHERE id = ?").run(stockChange, movement.item_id);
    db.prepare("DELETE FROM movements WHERE id = ?").run(movement.id);
  });

  try {
    transaction();
    res.json({ success: true });
  } catch (err: any) {
    const message = String(err?.message || "");
    if (message === "Movimentação não encontrada") {
      res.status(404).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
});

export default router;