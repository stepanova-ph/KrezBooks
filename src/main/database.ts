import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { logger } from './logger';
import { contactQueries, invoiceQueries, itemQueries } from './queries';
import { stockMovementQueries } from './queries/stockMovements';

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
    this.db.exec(contactQueries.createTable);
    logger.log('✓ Contacts table ready');

    this.db.exec(itemQueries.createTable);
    logger.log('✓ Items table ready');

    this.db.exec(stockMovementQueries.createTable);
    logger.log('✓ Stock Movements table ready');

    this.db.exec(invoiceQueries.createTable);
    logger.log('✓ Invoice table ready');




    // this.db.exec('CREATE INDEX IF NOT EXISTS idx_contacts_customer ON contacts(is_customer)');
    // this.db.exec('CREATE INDEX IF NOT EXISTS idx_contacts_supplier ON contacts(is_supplier)');
    // this.db.exec('CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)');
    
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