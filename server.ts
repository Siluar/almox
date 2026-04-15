import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("inventory.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
    UNIQUE(name, category_id)
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    subcategory_id INTEGER NOT NULL,
    current_stock REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    unit TEXT DEFAULT 'un',
    FOREIGN KEY (subcategory_id) REFERENCES subcategories (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('entry', 'exit')) NOT NULL,
    quantity REAL NOT NULL,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
  );
`);

// Seed initial data if empty
const categoryCount = (db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number }).count;
if (categoryCount === 0) {
  const seedData = [
    {
      category: "Escritório e Papelaria",
      subs: ["Papelaria em Geral", "Cartuchos e Toners", "Pastas e Arquivos", "Envelopes e Etiquetas"]
    },
    {
      category: "Informática e TI",
      subs: ["Periféricos (Mouse/Teclado)", "Cabos e Adaptadores", "Componentes de Hardware", "Mídias e Armazenamento"]
    },
    {
      category: "Limpeza e Conservação",
      subs: ["Produtos Químicos", "Papéis e Descartáveis", "Utensílios de Limpeza", "Higiene Pessoal"]
    },
    {
      category: "Copa e Cozinha",
      subs: ["Alimentos e Bebidas", "Descartáveis (Copos/Pratos)", "Utensílios de Copa"]
    },
    {
      category: "Manutenção e Infraestrutura",
      subs: ["Elétrica", "Hidráulica", "Pintura", "Ferramentas Manuais"]
    },
    {
      category: "Segurança e EPI",
      subs: ["Proteção Individual", "Sinalização de Segurança", "Primeiros Socorros"]
    },
    {
      category: "Mobiliário e Equipamentos",
      subs: ["Móveis de Escritório", "Eletrodomésticos", "Equipamentos de Climatização"]
    }
  ];

  const insertCategory = db.prepare("INSERT INTO categories (name) VALUES (?)");
  const insertSub = db.prepare("INSERT INTO subcategories (name, category_id) VALUES (?, ?)");

  seedData.forEach(data => {
    const result = insertCategory.run(data.category);
    const categoryId = result.lastInsertRowid;
    data.subs.forEach(sub => {
      insertSub.run(sub, categoryId);
    });
  });
  
  console.log("Seed data inserted successfully.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
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

    const stockByCategory = db.prepare(`
      SELECT c.name, SUM(i.current_stock) as total_stock
      FROM items i
      JOIN subcategories s ON i.subcategory_id = s.id
      JOIN categories c ON s.category_id = c.id
      GROUP BY c.id
    `).all();

    res.json({
      totalItems,
      totalMovements,
      recentMovements,
      stockByCategory
    });
  });
  
  // Categories
  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", (req, res) => {
    const { name } = req.body;
    try {
      const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
      res.json({ id: info.lastInsertRowid, name });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/categories/:id", (req, res) => {
    const { name } = req.body;
    try {
      db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/categories/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Subcategories
  app.get("/api/subcategories", (req, res) => {
    const subcategories = db.prepare(`
      SELECT s.*, c.name as category_name 
      FROM subcategories s 
      JOIN categories c ON s.category_id = c.id
    `).all();
    res.json(subcategories);
  });

  app.post("/api/subcategories", (req, res) => {
    const { name, category_id } = req.body;
    try {
      const info = db.prepare("INSERT INTO subcategories (name, category_id) VALUES (?, ?)").run(name, category_id);
      res.json({ id: info.lastInsertRowid, name, category_id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/subcategories/:id", (req, res) => {
    const { name, category_id } = req.body;
    try {
      db.prepare("UPDATE subcategories SET name = ?, category_id = ? WHERE id = ?").run(name, category_id, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/subcategories/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM subcategories WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Items
  app.get("/api/items", (req, res) => {
    const items = db.prepare(`
      SELECT i.*, s.name as subcategory_name, c.name as category_name, c.id as category_id
      FROM items i
      JOIN subcategories s ON i.subcategory_id = s.id
      JOIN categories c ON s.category_id = c.id
    `).all();
    res.json(items);
  });

  app.get("/api/items/:id", (req, res) => {
    const item = db.prepare(`
      SELECT i.*, s.name as subcategory_name, c.name as category_name, c.id as category_id
      FROM items i
      JOIN subcategories s ON i.subcategory_id = s.id
      JOIN categories c ON s.category_id = c.id
      WHERE i.id = ?
    `).get(req.params.id);
    res.json(item);
  });

  app.post("/api/items", (req, res) => {
    const { name, description, subcategory_id, unit, initial_stock, min_stock } = req.body;
    
    const transaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO items (name, description, subcategory_id, current_stock, min_stock, unit) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, description, subcategory_id, initial_stock || 0, min_stock || 0, unit);

      const itemId = info.lastInsertRowid;

      if (initial_stock > 0) {
        db.prepare(`
          INSERT INTO movements (item_id, type, quantity, notes) 
          VALUES (?, 'entry', ?, 'Estoque inicial')
        `).run(itemId, initial_stock);
      }

      return itemId;
    });

    try {
      const itemId = transaction();
      res.json({ id: itemId, ...req.body, current_stock: initial_stock || 0 });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/items/:id", (req, res) => {
    const { name, description, subcategory_id, unit, min_stock } = req.body;
    try {
      db.prepare(`
        UPDATE items 
        SET name = ?, description = ?, subcategory_id = ?, unit = ?, min_stock = ?
        WHERE id = ?
      `).run(name, description, subcategory_id, unit, min_stock || 0, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/items/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM items WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Movements
  app.get("/api/movements", (req, res) => {
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

  app.post("/api/movements", (req, res) => {
    const { item_id, type, quantity, notes } = req.body;
    
    const transaction = db.transaction(() => {
      // Insert movement
      db.prepare(`
        INSERT INTO movements (item_id, type, quantity, notes) 
        VALUES (?, ?, ?, ?)
      `).run(item_id, type, quantity, notes);

      // Update item stock
      const stockChange = type === 'entry' ? quantity : -quantity;
      db.prepare(`
        UPDATE items SET current_stock = current_stock + ? WHERE id = ?
      `).run(stockChange, item_id);

      return db.prepare("SELECT current_stock FROM items WHERE id = ?").get(item_id) as { current_stock: number };
    });

    try {
      const result = transaction();
      res.json({ success: true, new_stock: result.current_stock });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/movements/:id", (req, res) => {
    const transaction = db.transaction(() => {
      const movement = db.prepare("SELECT * FROM movements WHERE id = ?").get(req.params.id) as any;
      if (!movement) throw new Error("Movimentação não encontrada");

      // Reverse stock change
      const stockChange = movement.type === 'entry' ? -movement.quantity : movement.quantity;
      db.prepare("UPDATE items SET current_stock = current_stock + ? WHERE id = ?").run(stockChange, movement.item_id);

      // Delete movement
      db.prepare("DELETE FROM movements WHERE id = ?").run(req.params.id);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Reports Data
  app.get("/api/reports", (req, res) => {
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

  // Export/Import
  app.get("/api/export", (req, res) => {
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

  app.post("/api/import", (req, res) => {
    const data = req.body;
    if (!data.categories || !data.items) {
      return res.status(400).json({ error: "Formato de arquivo inválido" });
    }

    const transaction = db.transaction(() => {
      // Clear existing data
      db.prepare("DELETE FROM movements").run();
      db.prepare("DELETE FROM items").run();
      db.prepare("DELETE FROM subcategories").run();
      db.prepare("DELETE FROM categories").run();

      // Import categories
      const insertCat = db.prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
      data.categories.forEach((cat: any) => {
        insertCat.run(cat.id, cat.name);
      });

      // Import subcategories
      const insertSub = db.prepare("INSERT INTO subcategories (id, name, category_id) VALUES (?, ?, ?)");
      data.subcategories.forEach((sub: any) => {
        insertSub.run(sub.id, sub.name, sub.category_id);
      });

      // Import items
      const insertItem = db.prepare(`
        INSERT INTO items (id, name, description, subcategory_id, current_stock, min_stock, unit) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      data.items.forEach((item: any) => {
        insertItem.run(item.id, item.name, item.description, item.subcategory_id, item.current_stock, item.min_stock, item.unit);
      });

      // Import movements
      const insertMovement = db.prepare(`
        INSERT INTO movements (id, item_id, type, quantity, date, notes) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      data.movements.forEach((m: any) => {
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
