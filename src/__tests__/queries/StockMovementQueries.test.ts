import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { stockMovementQueries } from '../../../src/main/queries/stockMovements';
import { invoiceQueries } from '../../../src/main/queries/invoices';
import { itemQueries } from '../../../src/main/queries/items';

describe('stockMovementQueries', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    
    // Create related tables first
    db.exec(invoiceQueries.createTable);
    db.exec(itemQueries.createTable);
    db.exec(stockMovementQueries.createTable);

    // Insert test invoice and item
    db.prepare(invoiceQueries.create).run({
      number: 'INV001',
      type: 1,
      date_issue: '2024-01-15',
    });

    db.prepare(itemQueries.create).run({
      ean: '1234567890123',
      name: 'Test Product',
      vat_rate: 1,
      unit_of_measure: 'ks',
      sale_price_group1: 100,
      sale_price_group2: 90,
      sale_price_group3: 80,
      sale_price_group4: 70,
    });
  });

  describe('getAll', () => {
    it('should return empty array when no movements exist', () => {
      const result = db.prepare(stockMovementQueries.getAll).all();
      expect(result).toEqual([]);
    });

    it('should return all movements ordered by created_at DESC', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      // Add another item
      db.prepare(itemQueries.create).run({
        ean: '9999999999999',
        name: 'Another Product',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 200,
        sale_price_group2: 180,
        sale_price_group3: 160,
        sale_price_group4: 140,
      });

      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      insert.run({
        invoice_number: 'INV001',
        item_ean: '9999999999999',
        amount: '5',
        price_per_unit: '200',
        vat_rate: 1,
      });

      const results = db.prepare(stockMovementQueries.getAll).all();

      expect(results).toHaveLength(2);
      // Most recent first
      expect(results[0].item_ean).toBe('9999999999999');
      expect(results[1].item_ean).toBe('1234567890123');
    });
  });

  describe('getOne', () => {
    it('should return undefined when movement does not exist', () => {
      const result = db.prepare(stockMovementQueries.getOne).get('INV999', '9999999999999');
      expect(result).toBeUndefined();
    });

    it('should return movement by invoice_number and item_ean', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      const result = db.prepare(stockMovementQueries.getOne).get('INV001', '1234567890123');

      expect(result).toBeDefined();
      expect(result.invoice_number).toBe('INV001');
      expect(result.item_ean).toBe('1234567890123');
      expect(result.amount).toBe('10');
      expect(result.price_per_unit).toBe('100');
    });
  });

  describe('getByInvoice', () => {
    it('should return empty array when no movements for invoice', () => {
      const result = db.prepare(stockMovementQueries.getByInvoice).all('INV999');
      expect(result).toEqual([]);
    });

    it('should return all movements for an invoice ordered by item_ean', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      // Add more items
      db.prepare(itemQueries.create).run({
        ean: '9999999999999',
        name: 'Product Z',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 200,
        sale_price_group2: 180,
        sale_price_group3: 160,
        sale_price_group4: 140,
      });

      db.prepare(itemQueries.create).run({
        ean: '5555555555555',
        name: 'Product M',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 150,
        sale_price_group2: 135,
        sale_price_group3: 120,
        sale_price_group4: 105,
      });

      insert.run({
        invoice_number: 'INV001',
        item_ean: '9999999999999',
        amount: '5',
        price_per_unit: '200',
        vat_rate: 1,
      });

      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      insert.run({
        invoice_number: 'INV001',
        item_ean: '5555555555555',
        amount: '3',
        price_per_unit: '150',
        vat_rate: 1,
      });

      const results = db.prepare(stockMovementQueries.getByInvoice).all('INV001');

      expect(results).toHaveLength(3);
      expect(results[0].item_ean).toBe('1234567890123');
      expect(results[1].item_ean).toBe('5555555555555');
      expect(results[2].item_ean).toBe('9999999999999');
    });
  });

  describe('create', () => {
    it('should insert new stock movement', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      const result = insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      expect(result.changes).toBe(1);

      const check = db.prepare(stockMovementQueries.getOne).get('INV001', '1234567890123');
      expect(check).toBeDefined();
      expect(check.amount).toBe('10');
      expect(check.price_per_unit).toBe('100');
    });

    it('should set created_at timestamp automatically', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      const result = db.prepare(stockMovementQueries.getOne).get('INV001', '1234567890123');

      expect(result.created_at).toBeDefined();
      expect(typeof result.created_at).toBe('string');
    });
  });

  describe('delete', () => {
    it('should delete movement by invoice_number and item_ean', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      const deleteStmt = db.prepare(stockMovementQueries.delete);
      const result = deleteStmt.run('INV001', '1234567890123');

      expect(result.changes).toBe(1);

      const check = db.prepare(stockMovementQueries.getOne).get('INV001', '1234567890123');
      expect(check).toBeUndefined();
    });

    it('should return 0 changes when movement does not exist', () => {
      const deleteStmt = db.prepare(stockMovementQueries.delete);
      const result = deleteStmt.run('INV999', '9999999999999');

      expect(result.changes).toBe(0);
    });
  });

  describe('deleteByInvoice', () => {
    it('should delete all movements for an invoice', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      // Add another item
      db.prepare(itemQueries.create).run({
        ean: '9999999999999',
        name: 'Another Product',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 200,
        sale_price_group2: 180,
        sale_price_group3: 160,
        sale_price_group4: 140,
      });

      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      insert.run({
        invoice_number: 'INV001',
        item_ean: '9999999999999',
        amount: '5',
        price_per_unit: '200',
        vat_rate: 1,
      });

      const deleteStmt = db.prepare(stockMovementQueries.deleteByInvoice);
      const result = deleteStmt.run('INV001');

      expect(result.changes).toBe(2);

      const check = db.prepare(stockMovementQueries.getByInvoice).all('INV001');
      expect(check).toHaveLength(0);
    });
  });

  describe('composite primary key', () => {
    it('should allow same item_ean with different invoice_number', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      // Create another invoice
      db.prepare(invoiceQueries.create).run({
        number: 'INV002',
        type: 1,
        date_issue: '2024-01-20',
      });

      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      expect(() => {
        insert.run({
          invoice_number: 'INV002',
          item_ean: '1234567890123',
          amount: '5',
          price_per_unit: '90',
          vat_rate: 1,
        });
      }).not.toThrow();
    });

    it('should reject duplicate invoice_number + item_ean combination', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      expect(() => {
        insert.run({
          invoice_number: 'INV001',
          item_ean: '1234567890123',
          amount: '20',
          price_per_unit: '90',
          vat_rate: 1,
        });
      }).toThrow();
    });
  });

  describe('foreign key constraints', () => {
    it('should reject movement with non-existent invoice_number', () => {
      const insert = db.prepare(stockMovementQueries.create);

      expect(() => {
        insert.run({
          invoice_number: 'INV999',
          item_ean: '1234567890123',
          amount: '10',
          price_per_unit: '100',
          vat_rate: 1,
        });
      }).toThrow();
    });

    it('should reject movement with non-existent item_ean', () => {
      const insert = db.prepare(stockMovementQueries.create);

      expect(() => {
        insert.run({
          invoice_number: 'INV001',
          item_ean: '9999999999999',
          amount: '10',
          price_per_unit: '100',
          vat_rate: 1,
        });
      }).toThrow();
    });

    it('should cascade delete movements when invoice is deleted', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      // Delete the invoice
      db.prepare(invoiceQueries.delete).run('INV001');

      // Movement should be gone
      const check = db.prepare(stockMovementQueries.getOne).get('INV001', '1234567890123');
      expect(check).toBeUndefined();
    });

    it('should prevent item deletion when movements exist', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      // Try to delete the item
      expect(() => {
        db.prepare(itemQueries.delete).run('1234567890123');
      }).toThrow();
    });
  });

  describe('getStockAmountByItem', () => {
    it('should return 0 when no movements exist for item', () => {
      const result = db.prepare(stockMovementQueries.getStockAmountByItem).get('1234567890123');
      expect(result.total_amount).toBe(0);
    });

    it('should sum amounts for an item', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      // Create another invoice
      db.prepare(invoiceQueries.create).run({
        number: 'INV002',
        type: 1,
        date_issue: '2024-01-20',
      });

      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      insert.run({
        invoice_number: 'INV002',
        item_ean: '1234567890123',
        amount: '5',
        price_per_unit: '90',
        vat_rate: 1,
      });

      const result = db.prepare(stockMovementQueries.getStockAmountByItem).get('1234567890123');
      expect(result.total_amount).toBe(15);
    });

    it('should handle negative amounts', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      // Create another invoice
      db.prepare(invoiceQueries.create).run({
        number: 'INV002',
        type: 1,
        date_issue: '2024-01-20',
      });

      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      insert.run({
        invoice_number: 'INV002',
        item_ean: '1234567890123',
        amount: '-3',
        price_per_unit: '100',
        vat_rate: 1,
      });

      const result = db.prepare(stockMovementQueries.getStockAmountByItem).get('1234567890123');
      expect(result.total_amount).toBe(7);
    });
  });

  describe('getAverageBuyPriceByItem', () => {
    it('should return 0 when no buy invoices exist', () => {
      const result = db.prepare(stockMovementQueries.getAverageBuyPriceByItem).get('1234567890123');
      expect(result.avg_price).toBe(0);
    });

    it('should calculate average price for type 1 and 2 invoices', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      // Create invoices of different types
      db.prepare(invoiceQueries.create).run({
        number: 'INV002',
        type: 1,
        date_issue: '2024-01-20',
      });

      db.prepare(invoiceQueries.create).run({
        number: 'INV003',
        type: 2,
        date_issue: '2024-01-21',
      });

      db.prepare(invoiceQueries.create).run({
        number: 'INV004',
        type: 3,
        date_issue: '2024-01-22',
      });

      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      insert.run({
        invoice_number: 'INV002',
        item_ean: '1234567890123',
        amount: '5',
        price_per_unit: '120',
        vat_rate: 1,
      });

      insert.run({
        invoice_number: 'INV003',
        item_ean: '1234567890123',
        amount: '3',
        price_per_unit: '110',
        vat_rate: 1,
      });

      // This should be excluded (type 3)
      insert.run({
        invoice_number: 'INV004',
        item_ean: '1234567890123',
        amount: '2',
        price_per_unit: '200',
        vat_rate: 1,
      });

      const result = db.prepare(stockMovementQueries.getAverageBuyPriceByItem).get('1234567890123');
      expect(result.avg_price).toBeCloseTo(110, 1);
    });
  });

  describe('getLastBuyPriceByItem', () => {
    it('should return 0 when no buy invoices exist', () => {
      const result = db.prepare(stockMovementQueries.getLastBuyPriceByItem).get('1234567890123');
      expect(result.last_price).toBe(0);
    });

    it('should return most recent buy price for type 1 and 2 invoices', () => {
      const insert = db.prepare(stockMovementQueries.create);
      
      // Create invoices
      db.prepare(invoiceQueries.create).run({
        number: 'INV002',
        type: 1,
        date_issue: '2024-01-20',
      });

      db.prepare(invoiceQueries.create).run({
        number: 'INV003',
        type: 2,
        date_issue: '2024-01-21',
      });

      insert.run({
        invoice_number: 'INV001',
        item_ean: '1234567890123',
        amount: '10',
        price_per_unit: '100',
        vat_rate: 1,
      });

      // Wait a tiny bit to ensure different timestamps
      insert.run({
        invoice_number: 'INV002',
        item_ean: '1234567890123',
        amount: '5',
        price_per_unit: '120',
        vat_rate: 1,
      });

      insert.run({
        invoice_number: 'INV003',
        item_ean: '1234567890123',
        amount: '3',
        price_per_unit: '110',
        vat_rate: 1,
      });

      const result = db.prepare(stockMovementQueries.getLastBuyPriceByItem).get('1234567890123');
      expect(result.last_price).toBe(110);
    });
  });
});