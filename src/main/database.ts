// Database module - SQLite setup and initialization

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: Database.Database | null = null;

/**
 * Get the database file path
 * Uses the app's userData directory (platform-specific)
 */
function getDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  
  // Ensure the directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  
  return path.join(userDataPath, 'krezbooks.db');
}

/**
 * Initialize the database and create tables
 */
export function initDatabase(): Database.Database {
  if (db) return db;

  const dbPath = getDatabasePath();
  console.log('Database path:', dbPath);

  // Open database connection
  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  createTables();

  console.log('Database initialized successfully');
  return db;
}

/**
 * Create database tables based on the schema
 */
function createTables() {
  if (!db) throw new Error('Database not initialized');

  // Contacts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      ico TEXT NOT NULL,
      modifier INTEGER NOT NULL DEFAULT 1,
      dic TEXT,
      company_name TEXT NOT NULL,
      representative_name TEXT,
      street TEXT,
      city TEXT,
      postal_code TEXT,
      is_supplier INTEGER NOT NULL DEFAULT 0,
      is_customer INTEGER NOT NULL DEFAULT 0,
      price_group INTEGER NOT NULL DEFAULT 1,
      phone TEXT,
      email TEXT,
      website TEXT,
      bank_account TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (ico, modifier),
      CONSTRAINT check_price_group CHECK (price_group BETWEEN 1 AND 4)
    )
  `);

  // Items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sales_group TEXT,
      name TEXT NOT NULL,
      note TEXT,
      vat_rate INTEGER NOT NULL DEFAULT 1,
      avg_purchase_price INTEGER NOT NULL DEFAULT 0,
      last_purchase_price INTEGER NOT NULL DEFAULT 0,
      unit_of_measure TEXT NOT NULL DEFAULT 'ks',
      sale_price_group1 INTEGER NOT NULL DEFAULT 0,
      sale_price_group2 INTEGER NOT NULL DEFAULT 0,
      sale_price_group3 INTEGER NOT NULL DEFAULT 0,
      sale_price_group4 INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT check_vat_rate CHECK (vat_rate IN (0, 1, 2))
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_contacts_customer 
      ON contacts(is_customer) WHERE is_customer = 1;
    
    CREATE INDEX IF NOT EXISTS idx_contacts_supplier 
      ON contacts(is_supplier) WHERE is_supplier = 1;
    
    CREATE INDEX IF NOT EXISTS idx_items_sales_group 
      ON items(sales_group);
  `);

  console.log('Tables created successfully');
}

/**
 * Get the database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('Database closed');
  }
}
