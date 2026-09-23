import { Router } from "express";
import { db } from "../db";

const router = Router();

router.get("/export", (_req, res) => {
  try {
    const categories = db.prepare("SELECT * FROM categories").all();
    const subcategories = db.prepare("SELECT * FROM subcategories").all();
    const items = db.prepare("SELECT * FROM items").all();
    const movements = db.prepare("SELECT * FROM movements").all();

    res.json({
      categories,
      subcategories,
      items,
      movements,
      version: "1.0",
      date: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/import", (req, res) => {
  const data = req.body || {};
  if (!Array.isArray(data.categories) || !Array.isArray(data.items)) {
    res.status(400).json({ error: "Formato de arquivo inválido" });
    return;
  }

  const subcategories = Array.isArray(data.subcategories) ? data.subcategories : [];
  const movements = Array.isArray(data.movements) ? data.movements : [];

  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM movements").run();
    db.prepare("DELETE FROM items").run();
    db.prepare("DELETE FROM subcategories").run();
    db.prepare("DELETE FROM categories").run();

    const insertCat = db.prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
    data.categories.forEach((cat: any) => {
      insertCat.run(cat.id, cat.name);
    });

    const insertSub = db.prepare("INSERT INTO subcategories (id, name, category_id) VALUES (?, ?, ?)");
    subcategories.forEach((sub: any) => {
      insertSub.run(sub.id, sub.name, sub.category_id);
    });

    const insertItem = db.prepare(`
      INSERT INTO items (id, name, description, subcategory_id, current_stock, min_stock, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    data.items.forEach((item: any) => {
      insertItem.run(item.id, item.name, item.description, item.subcategory_id, item.current_stock, item.min_stock, item.unit);
    });

    const insertMovement = db.prepare(`
      INSERT INTO movements (id, item_id, type, quantity, date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    movements.forEach((m: any) => {
      insertMovement.run(m.id, m.item_id, m.type, m.quantity, m.date, m.notes);
    });
  });

  try {
    transaction();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;