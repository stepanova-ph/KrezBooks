import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { logger } from './logger';

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private getDatabasePath(): string {
    const userDataPath = app.getPath('userData');
    
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

  public initDatabase(): Database.Database {
    try {
      logger.info("database init happening!!!!");
      if (this.db) return this.db;

      const dbPath = this.getDatabasePath();
      logger.log('Database path:', dbPath);

      try {
        this.db = new Database(dbPath);
      } catch (error) {
        logger.error('Failed to open database:', error);
        throw new Error(
          `Cannot open database: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      
      try {
        this.db.pragma('foreign_keys = ON');
      } catch (error) {
        logger.error('Failed to enable foreign keys:', error);
        throw new Error(
          `Cannot configure database: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      this.createTables();

      logger.log('Database initialized successfully');
      return this.db;
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      if (this.db) {
        try {
          this.db.close();
        } catch (closeError) {
          logger.error('Failed to close database after init error:', closeError);
        }
        this.db = null;
      }
      throw new Error(
        `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return this.db;
  }

  public closeDatabase() {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
        logger.log('Database closed');
      } catch (error) {
        logger.error('Error closing database:', error);
        this.db = null;
      }
    }
  }

  private createTables() {
  if (!this.db) throw new Error('Database not initialized');

  try {
    this.db.exec(`
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

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        ean TEXT PRIMARY KEY NOT NULL,
        category TEXT,
        name TEXT NOT NULL,
        note TEXT,
        vat_rate INTEGER NOT NULL DEFAULT 1,
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

    // Create indexes separately without WHERE clause
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_contacts_customer ON contacts(is_customer)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_contacts_supplier ON contacts(is_supplier)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)');
    
    logger.log('✓ Indexes created');

    logger.log('Tables created successfully');
  } catch (error) {
    logger.error('Failed to create tables:', error);
    throw new Error(
      `Table creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
}

export const initDatabase = () => DatabaseManager.getInstance().initDatabase();
export const getDatabase = () => DatabaseManager.getInstance().getDatabase();
export const closeDatabase = () => DatabaseManager.getInstance().closeDatabase();