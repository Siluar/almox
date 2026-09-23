import { Router } from "express";
import { db } from "../db";

const router = Router();

router.get("/", (_req, res) => {
  try {
    const lowStockItems = db.prepare(`
      SELECT i.*, s.name as subcategory_name, c.name as category_name
      FROM items i
      JOIN subcategories s ON i.subcategory_id = s.id
      JOIN categories c ON s.category_id = c.id
      WHERE i.current_stock <= i.min_stock AND i.current_stock > 0
    `).all();

    const outOfStockItems = db.prepare(`
      SELECT i.*, s.name as subcategory_name, c.name as category_name
      FROM items i
      JOIN subcategories s ON i.subcategory_id = s.id
      JOIN categories c ON s.category_id = c.id
      WHERE i.current_stock = 0
    `).all();

    const movementsByType = db.prepare(`
      SELECT type, COUNT(*) as count, SUM(quantity) as total_quantity
      FROM movements
      GROUP BY type
    `).all();

    const topItems = db.prepare(`
      SELECT i.name, COUNT(m.id) as movement_count, SUM(m.quantity) as total_quantity
      FROM movements m
      JOIN items i ON m.item_id = i.id
      WHERE m.type = 'exit'
      GROUP BY i.id
      ORDER BY movement_count DESC
      LIMIT 10
    `).all();

    const monthlyMovements = db.prepare(`
      SELECT
        strftime('%Y-%m', date) as month,
        type,
        COUNT(*) as count,
        SUM(quantity) as total_quantity
      FROM movements
      GROUP BY month, type
      ORDER BY month ASC
    `).all();

    const allItems = db.prepare(`
      SELECT
        i.*,
        s.name as subcategory_name,
        c.name as category_name,
        (SELECT MAX(date) FROM movements WHERE item_id = i.id) as last_movement,
        (SELECT SUM(quantity) FROM movements WHERE item_id = i.id AND type = 'entry') as total_entries,
        (SELECT SUM(quantity) FROM movements WHERE item_id = i.id AND type = 'exit') as total_exits
      FROM items i
      JOIN subcategories s ON i.subcategory_id = s.id
      JOIN categories c ON s.category_id = c.id
      ORDER BY c.name, s.name, i.name
    `).all();

    res.json({
      lowStockItems,
      outOfStockItems,
      movementsByType,
      topItems,
      monthlyMovements,
      allItems
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;