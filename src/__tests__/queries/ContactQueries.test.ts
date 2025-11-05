import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { contactQueries } from '../../main/queries/contacts';
import { serializeContact } from '../../utils/typeConverterUtils';
import { PriceGroup } from '../../types/database';

describe('contactQueries', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(contactQueries.createTable);
  });

  describe('getAll', () => {
    it('should return empty array when no contacts exist', () => {
      const result = db.prepare(contactQueries.getAll).all();
      expect(result).toEqual([]);
    });

    it('should return all contacts ordered by company_name', () => {
      const insert = db.prepare(contactQueries.create);
      
      insert.run(serializeContact({
        ico: '11111111',
        modifier: 1,
        company_name: 'Zebra Corp',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      }));

      insert.run(serializeContact({
        ico: '22222222',
        modifier: 1,
        company_name: 'Alpha Inc',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      }));

      const results = db.prepare(contactQueries.getAll).all();

      expect(results).toHaveLength(2);
      expect(results[0].company_name).toBe('Alpha Inc');
      expect(results[1].company_name).toBe('Zebra Corp');
    });
  });

  describe('getOne', () => {
    it('should return undefined when contact does not exist', () => {
      const result = db.prepare(contactQueries.getOne).get('99999999', 1);
      expect(result).toBeUndefined();
    });

    it('should return contact by ico and modifier', () => {
      const insert = db.prepare(contactQueries.create);
      
      insert.run(serializeContact({
        ico: '12345678',
        modifier: 1,
        company_name: 'Test Company',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      }));

      const result = db.prepare(contactQueries.getOne).get('12345678', 1);

      expect(result).toBeDefined();
      expect(result.ico).toBe('12345678');
      expect(result.modifier).toBe(1);
      expect(result.company_name).toBe('Test Company');
    });

    it('should distinguish between different modifiers', () => {
      const insert = db.prepare(contactQueries.create);
      
      insert.run(serializeContact({
        ico: '12345678',
        modifier: 1,
        company_name: 'Company A',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      }));

      insert.run(serializeContact({
        ico: '12345678',
        modifier: 2,
        company_name: 'Company B',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      }));

      const result1 = db.prepare(contactQueries.getOne).get('12345678', 1);
      const result2 = db.prepare(contactQueries.getOne).get('12345678', 2);

      expect(result1.company_name).toBe('Company A');
      expect(result2.company_name).toBe('Company B');
    });
  });

  describe('create', () => {
    it('should insert new contact with all fields', () => {
      const insert = db.prepare(contactQueries.create);
      
      const result = insert.run(serializeContact({
        ico: '12345678',
        modifier: 1,
        dic: 'CZ12345678',
        company_name: 'Test Company',
        representative_name: 'John Doe',
        street: '123 Main St',
        city: 'Prague',
        postal_code: '11000',
        is_supplier: true,
        is_customer: true,
        price_group: 2,
        phone: '+420123456789',
        email: 'test@example.com',
        website: 'example.com',
        bank_account: '123456-1234567890/0100',
      }));

      expect(result.changes).toBe(1);

      const check = db.prepare(contactQueries.getOne).get('12345678', 1);
      expect(check.company_name).toBe('Test Company');
      expect(check.dic).toBe('CZ12345678');
      expect(check.email).toBe('test@example.com');
    });

    it('should insert contact with only required fields', () => {
      const insert = db.prepare(contactQueries.create);
      
      const result = insert.run(serializeContact({
        ico: '12345678',
        modifier: 1,
        company_name: 'Minimal Company',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      }));

      expect(result.changes).toBe(1);
    });

  });

  describe('delete', () => {
    it('should delete contact by ico and modifier', () => {
      const insert = db.prepare(contactQueries.create);
      
      insert.run(serializeContact({
        ico: '12345678',
        modifier: 1,
        company_name: 'Test',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      }));

      const deleteStmt = db.prepare(contactQueries.delete);
      const result = deleteStmt.run('12345678', 1);

      expect(result.changes).toBe(1);

      const check = db.prepare(contactQueries.getOne).get('12345678', 1);
      expect(check).toBeUndefined();
    });

    it('should return 0 changes when contact does not exist', () => {
      const deleteStmt = db.prepare(contactQueries.delete);
      const result = deleteStmt.run('99999999', 1);

      expect(result.changes).toBe(0);
    });
  });

  describe('composite key constraints', () => {
    it('should allow same ico with different modifier', () => {
      const insert = db.prepare(contactQueries.create);
      
      insert.run(serializeContact({
        ico: '12345678',
        modifier: 1,
        company_name: 'Company A',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      }));

      expect(() => {
        insert.run(serializeContact({
          ico: '12345678',
          modifier: 2,
          company_name: 'Company B',
          is_supplier: true,
          is_customer: false,
          price_group: 1,
        }));
      }).not.toThrow();

      const results = db.prepare(contactQueries.getAll).all();
      expect(results).toHaveLength(2);
    });

    it('should reject duplicate ico + modifier combination', () => {
      const insert = db.prepare(contactQueries.create);
      
      insert.run(serializeContact({
        ico: '12345678',
        modifier: 1,
        company_name: 'Company',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      }));

      expect(() => {
        insert.run(serializeContact({
          ico: '12345678',
          modifier: 1,
          company_name: 'Duplicate',
          is_supplier: true,
          is_customer: false,
          price_group: 1,
        }));
      }).toThrow();
    });
  });

  describe('price_group constraint', () => {
    it('should accept price_group values 1-4', () => {
      const insert = db.prepare(contactQueries.create);

      for (let i = 1; i <= 4; i++) {
        expect(() => {
          insert.run(serializeContact({
            ico: `1234567${i}`,
            modifier: 1,
            company_name: `Company ${i}`,
            is_supplier: true,
            is_customer: false,
            price_group: i as PriceGroup,
          }));
        }).not.toThrow();
      }
    });

    it('should reject price_group outside 1-4 range', () => {
      const insert = db.prepare(contactQueries.create);

      expect(() => {
        insert.run(serializeContact({
          ico: '12345678',
          modifier: 1,
          company_name: 'Invalid',
          is_supplier: true,
          is_customer: false,
          price_group: 0 as PriceGroup,
        }));
      }).toThrow();

      expect(() => {
        insert.run({
          ico: '12345679',
          modifier: 1,
          company_name: 'Invalid',
          is_supplier: 1,
          is_customer: 0,
          price_group: 5,
        });
      }).toThrow();
    });
  });
});