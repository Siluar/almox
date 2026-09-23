import { Router } from "express";
import { db } from "../db";

const router = Router();

router.get("/", (_req, res) => {
  const totalItems = (db.prepare("SELECT COUNT(*) as count FROM items").get() as { count: number }).count;
  const totalMovements = (db.prepare("SELECT COUNT(*) as count FROM movements").get() as { count: number }).count;

  const recentMovements = db.prepare(`
    SELECT m.date, m.type, m.quantity, i.name as item_name, i.description as item_description, s.name as subcategory_name, c.name as category_name
    FROM movements m
    JOIN items i ON m.item_id = i.id
    JOIN subcategories s ON i.subcategory_id = s.id
    JOIN categories c ON s.category_id = c.id
    ORDER BY m.date DESC
    LIMIT 5
  `).all();

  const itemsByCategory = db.prepare(`
    SELECT c.name, COUNT(i.id) as count
    FROM items i
    JOIN subcategories s ON i.subcategory_id = s.id
    JOIN categories c ON s.category_id = c.id
    GROUP BY c.id
    ORDER BY count DESC
  `).all();

  res.json({
    totalItems,
    totalMovements,
    recentMovements,
    itemsByCategory
  });
});

export default router;