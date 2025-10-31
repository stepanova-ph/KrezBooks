import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { itemQueries } from '../../main/queries/items';
import { serializeItem } from '../../utils/typeConverterUtils';
import { VatRate } from '../../types/database';

describe('itemQueries', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(itemQueries.createTable);
  });

  describe('getAll', () => {
    it('should return empty array when no items exist', () => {
      const result = db.prepare(itemQueries.getAll).all();
      expect(result).toEqual([]);
    });

    it('should return all items ordered by name', () => {
      const insert = db.prepare(itemQueries.create);
      
      insert.run(serializeItem({
        ean: '1111111111111',
        name: 'Zebra Product',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 100,
        sale_price_group2: 90,
        sale_price_group3: 80,
        sale_price_group4: 70,
      }));

      insert.run(serializeItem({
        ean: '2222222222222',
        name: 'Alpha Product',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 200,
        sale_price_group2: 180,
        sale_price_group3: 160,
        sale_price_group4: 140,
      }));

      const results = db.prepare(itemQueries.getAll).all();

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Alpha Product');
      expect(results[1].name).toBe('Zebra Product');
    });
  });

  describe('getOne', () => {
    it('should return undefined when item does not exist', () => {
      const result = db.prepare(itemQueries.getOne).get('9999999999999');
      expect(result).toBeUndefined();
    });

    it('should return item by ean', () => {
      const insert = db.prepare(itemQueries.create);
      
      insert.run(serializeItem({
        ean: '1234567890123',
        name: 'Test Product',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 100,
        sale_price_group2: 90,
        sale_price_group3: 80,
        sale_price_group4: 70,
      }));

      const result = db.prepare(itemQueries.getOne).get('1234567890123');

      expect(result).toBeDefined();
      expect(result.ean).toBe('1234567890123');
      expect(result.name).toBe('Test Product');
    });
  });

  describe('create', () => {
    it('should insert new item with all fields', () => {
      const insert = db.prepare(itemQueries.create);
      
      const result = insert.run(serializeItem({
        ean: '1234567890123',
        category: 'Electronics',
        name: 'Test Product',
        note: 'Test note',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 1000,
        sale_price_group2: 900,
        sale_price_group3: 800,
        sale_price_group4: 700,
      }));

      expect(result.changes).toBe(1);

      const check = db.prepare(itemQueries.getOne).get('1234567890123');
      expect(check.name).toBe('Test Product');
      expect(check.category).toBe('Electronics');
      expect(check.note).toBe('Test note');
      expect(check.vat_rate).toBe(1);
    });

    it('should insert item with only required fields', () => {
      const insert = db.prepare(itemQueries.create);
      
      const result = insert.run(serializeItem({
        ean: '1234567890123',
        name: 'Minimal Product',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 0,
        sale_price_group2: 0,
        sale_price_group3: 0,
        sale_price_group4: 0,
      }));

      expect(result.changes).toBe(1);

      const check = db.prepare(itemQueries.getOne).get('1234567890123');
      expect(check.name).toBe('Minimal Product');
      expect(check.category).toBeNull();
      expect(check.note).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete item by ean', () => {
      const insert = db.prepare(itemQueries.create);
      
      insert.run(serializeItem({
        ean: '1234567890123',
        name: 'Test',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 100,
        sale_price_group2: 90,
        sale_price_group3: 80,
        sale_price_group4: 70,
      }));

      const deleteStmt = db.prepare(itemQueries.delete);
      const result = deleteStmt.run('1234567890123');

      expect(result.changes).toBe(1);

      const check = db.prepare(itemQueries.getOne).get('1234567890123');
      expect(check).toBeUndefined();
    });

    it('should return 0 changes when item does not exist', () => {
      const deleteStmt = db.prepare(itemQueries.delete);
      const result = deleteStmt.run('9999999999999');

      expect(result.changes).toBe(0);
    });
  });

  describe('getCategories', () => {
    it('should return empty array when no categories exist', () => {
      const result = db.prepare(itemQueries.getCategories).all();
      expect(result).toEqual([]);
    });

    it('should return distinct categories ordered alphabetically', () => {
      const insert = db.prepare(itemQueries.create);
      
      insert.run(serializeItem({
        ean: '1111111111111',
        name: 'Product 1',
        category: 'Electronics',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 100,
        sale_price_group2: 90,
        sale_price_group3: 80,
        sale_price_group4: 70,
      }));

      insert.run(serializeItem({
        ean: '2222222222222',
        name: 'Product 2',
        category: 'Books',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 200,
        sale_price_group2: 180,
        sale_price_group3: 160,
        sale_price_group4: 140,
      }));

      insert.run(serializeItem({
        ean: '3333333333333',
        name: 'Product 3',
        category: 'Electronics',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 150,
        sale_price_group2: 135,
        sale_price_group3: 120,
        sale_price_group4: 105,
      }));

      const results = db.prepare(itemQueries.getCategories).all();

      expect(results).toHaveLength(2);
      expect(results[0].category).toBe('Books');
      expect(results[1].category).toBe('Electronics');
    });

    it('should exclude null and empty categories', () => {
      const insert = db.prepare(itemQueries.create);
      
      insert.run(serializeItem({
        ean: '1111111111111',
        name: 'Product 1',
        category: 'Electronics',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 100,
        sale_price_group2: 90,
        sale_price_group3: 80,
        sale_price_group4: 70,
      }));

      insert.run(serializeItem({
        ean: '2222222222222',
        name: 'Product 2',
        category: null,
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 200,
        sale_price_group2: 180,
        sale_price_group3: 160,
        sale_price_group4: 140,
      }));

      const results = db.prepare(itemQueries.getCategories).all();

      expect(results).toHaveLength(1);
      expect(results[0].category).toBe('Electronics');
    });
  });

  describe('vat_rate constraint', () => {
    it('should accept vat_rate values 0, 1, 2', () => {
      const insert = db.prepare(itemQueries.create);

      for (let i = 0; i <= 2; i++) {
        expect(() => {
          insert.run(serializeItem({
            ean: `111111111111${i}`,
            name: `Product ${i}`,
            vat_rate: i as VatRate,
            unit_of_measure: 'ks',
            sale_price_group1: 100,
            sale_price_group2: 90,
            sale_price_group3: 80,
            sale_price_group4: 70,
          }));
        }).not.toThrow();
      }
    });

    it('should reject invalid vat_rate values', () => {
      const insert = db.prepare(itemQueries.create);

      expect(() => {
        insert.run(serializeItem({
          ean: '1234567890123',
          name: 'Invalid',
          vat_rate: 3 as VatRate,
          unit_of_measure: 'ks',
          sale_price_group1: 100,
          sale_price_group2: 90,
          sale_price_group3: 80,
          sale_price_group4: 70,
        }));
      }).toThrow();

      expect(() => {
        insert.run(serializeItem({
          ean: '1234567890124',
          name: 'Invalid',
          vat_rate: -1 as VatRate,
          unit_of_measure: 'ks',
          sale_price_group1: 100,
          sale_price_group2: 90,
          sale_price_group3: 80,
          sale_price_group4: 70,
        }));
      }).toThrow();
    });
  });

  describe('primary key constraint', () => {
    it('should reject duplicate ean', () => {
      const insert = db.prepare(itemQueries.create);
      
      insert.run(serializeItem({
        ean: '1234567890123',
        name: 'Product 1',
        vat_rate: 1,
        unit_of_measure: 'ks',
        sale_price_group1: 100,
        sale_price_group2: 90,
        sale_price_group3: 80,
        sale_price_group4: 70,
      }));

      expect(() => {
        insert.run(serializeItem({
          ean: '1234567890123',
          name: 'Product 2',
          vat_rate: 1,
          unit_of_measure: 'ks',
          sale_price_group1: 200,
          sale_price_group2: 180,
          sale_price_group3: 160,
          sale_price_group4: 140,
        }));
      }).toThrow();
    });
  });
});