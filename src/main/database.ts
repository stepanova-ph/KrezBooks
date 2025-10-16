// Database module - SQLite setup and initialization

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { logger } from './logger';

let db: Database.Database | null = null;

/**
 * Get the database file path
 * Uses the app's userData directory (platform-specific)
 */
function getDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  
  // Ensure the directory exists
  if (!fs.existsSync(userDataPath)) {
    try {
      fs.mkdirSync(userDataPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create user data directory:', error);
      throw new Error(
        `Cannot create data directory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  return path.join(userDataPath, 'krezbooks.db');
}

/**
 * Initialize the database and create tables
 */
export function initDatabase(): Database.Database {
  try {
    if (db) return db;

    const dbPath = getDatabasePath();
    logger.log('Database path:', dbPath);

    // Open database connection
    try {
      db = new Database(dbPath);
    } catch (error) {
      logger.error('Failed to open database:', error);
      throw new Error(
        `Cannot open database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
    
    // Enable foreign keys
    try {
      db.pragma('foreign_keys = ON');
    } catch (error) {
      logger.error('Failed to enable foreign keys:', error);
      throw new Error(
        `Cannot configure database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Create tables
    createTables();

    logger.log('Database initialized successfully');
    return db;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    // Close DB if it was opened
    if (db) {
      try {
        db.close();
      } catch (closeError) {
        logger.error('Failed to close database after init error:', closeError);
      }
      db = null;
    }
    throw new Error(
      `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create database tables based on the schema
 */
function createTables() {
  if (!db) throw new Error('Database not initialized');

  try {
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
    logger.log('✓ Contacts table ready');

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
    logger.log('✓ Items table ready');

    // Create indexes for better performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_contacts_customer 
        ON contacts(is_customer) WHERE is_customer = 1;
      
      CREATE INDEX IF NOT EXISTS idx_contacts_supplier 
        ON contacts(is_supplier) WHERE is_supplier = 1;
      
      CREATE INDEX IF NOT EXISTS idx_items_sales_group 
        ON items(sales_group);
    `);
    logger.log('✓ Indexes created');

    logger.log('Tables created successfully');
  } catch (error) {
    logger.error('Failed to create tables:', error);
    throw new Error(
      `Table creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
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
    try {
      db.close();
      db = null;
      logger.log('Database closed');
    } catch (error) {
      logger.error('Error closing database:', error);
      // Still set to null even if close fails
      db = null;
    }
  }
}