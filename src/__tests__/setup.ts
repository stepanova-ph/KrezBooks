import Database from 'better-sqlite3';
import { beforeEach, afterEach, vi } from 'vitest';
import { contactQueries } from '../main/queries/contacts';
import { itemQueries } from '../main/queries/items';
import { stockMovementQueries } from '../main/queries/stockMovements';
import { invoiceQueries } from '../main/queries/invoices';

// Mock logger to avoid console spam in tests
vi.mock('../main/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
  },
}));

// Test database instance
let testDb: Database.Database | null = null;

// Create in-memory database for tests
export function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  
  // Create tables
  db.exec(contactQueries.createTable);
  db.exec(itemQueries.createTable);
  db.exec(stockMovementQueries.createTable);
  db.exec(invoiceQueries.createTable);
  
  return db;
}

// Mock the database module
vi.mock('../main/database', () => {
  return {
    getDatabase: () => {
      if (!testDb) {
        testDb = createTestDatabase();
      }
      return testDb;
    },
    initDatabase: () => {
      if (!testDb) {
        testDb = createTestDatabase();
      }
      return testDb;
    },
    closeDatabase: () => {
      if (testDb) {
        testDb.close();
        testDb = null;
      }
    },
  };
});

// Reset database before each test
beforeEach(() => {
  if (testDb) {
    testDb.close();
  }
  testDb = createTestDatabase();
});

// Clean up after each test
afterEach(() => {
  if (testDb) {
    testDb.close();
    testDb = null;
  }
});