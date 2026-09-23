import Database from "better-sqlite3";

const db = new Database(process.env.DB_PATH || "inventory.db");

db.pragma("journal_mode = WAL");

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

function seed() {
  const categoryCount = (db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number }).count;
  if (categoryCount > 0) return;

  const insertCategory = db.prepare("INSERT INTO categories (name) VALUES (?)");
  const insertSub = db.prepare("INSERT INTO subcategories (name, category_id) VALUES (?, ?)");

  const transaction = db.transaction(() => {
    seedData.forEach(data => {
      const result = insertCategory.run(data.category);
      const categoryId = result.lastInsertRowid;
      data.subs.forEach(sub => {
        insertSub.run(sub, categoryId);
      });
    });
  });

  transaction();
  console.log("Seed data inserted successfully.");
}

export function initDb(): Database.Database {
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
      date TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      notes TEXT,
      FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
    );
  `);

  seed();
  return db;
}

export { db };