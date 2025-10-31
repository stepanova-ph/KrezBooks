import { describe, it, expect, beforeEach } from 'vitest';
import { ItemService } from '../../service/ItemService';
import type { CreateItemInput, Item, VatRate } from '../../types/database';
import { VAT_RATES } from '../../config/constants';

describe('ItemService', () => {
  let itemService: ItemService;

  beforeEach(() => {
    itemService = new ItemService();
  });

  describe('create', () => {
    it('should create a new item with all fields', async () => {
      const newItem: CreateItemInput = {
        ean: '1234567890123',
        name: 'Test Product',
        category: 'Electronics',
        note: 'Test note',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 100.00,
        sale_price_group2: 95.00,
        sale_price_group3: 90.00,
        sale_price_group4: 85.00,
      };

      const result = await itemService.create(newItem);

      expect(result).toHaveProperty('changes');
      expect(result.changes).toBe(1);
    });

    it('should create item with minimal required fields', async () => {
      const minimalItem: CreateItemInput = {
        ean: '9876543210987',
        name: 'Minimal Product',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 50.00,
        sale_price_group2: 50.00,
        sale_price_group3: 50.00,
        sale_price_group4: 50.00,
      };

      const result = await itemService.create(minimalItem);

      expect(result.changes).toBe(1);
    });

    it('should throw error for duplicate EAN', async () => {
      const item: CreateItemInput = {
        ean: '1111111111111',
        name: 'First Product',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 100.00,
        sale_price_group2: 100.00,
        sale_price_group3: 100.00,
        sale_price_group4: 100.00,
      };

      await itemService.create(item);

      await expect(itemService.create(item)).rejects.toThrow();
    });

    it('should handle null optional fields correctly', async () => {
      const item: CreateItemInput = {
        ean: '2222222222222',
        name: 'Product Without Optional Fields',
        category: undefined,
        note: undefined,
        vat_rate: 2,
        unit_of_measure: 'l',
        sale_price_group1: 75.50,
        sale_price_group2: 75.50,
        sale_price_group3: 75.50,
        sale_price_group4: 75.50,
      };

      const result = await itemService.create(item);
      expect(result.changes).toBe(1);

      const retrieved = await itemService.getOne('2222222222222');
      expect(retrieved).toBeDefined();
      expect(retrieved?.category).toBeNull();
      expect(retrieved?.note).toBeNull();
    });

    it('should accept all valid VAT rates (0, 12, 21)', async () => {
      for (let i = 0; i <= 2; i++) {
        const item: CreateItemInput = {
          ean: `${i}000000000`,
          name: `Product VAT ${VAT_RATES[i]}`,
          vat_rate: i as VatRate,
          unit_of_measure: 'ks',
          sale_price_group1: 100.00,
          sale_price_group2: 100.00,
          sale_price_group3: 100.00,
          sale_price_group4: 100.00,
        };

        const result = await itemService.create(item);
        expect(result.changes).toBe(1);

        const retrieved = await itemService.getOne(`${i}000000000`);
        expect(retrieved?.vat_rate).toBe(VAT_RATES[i].value);
      }
    });

    it('should handle different price groups', async () => {
      const item: CreateItemInput = {
        ean: '3333333333333',
        name: 'Multi-Price Product',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 100.00,
        sale_price_group2: 90.00,
        sale_price_group3: 80.00,
        sale_price_group4: 70.00,
      };

      await itemService.create(item);

      const retrieved = await itemService.getOne('3333333333333');
      expect(retrieved?.sale_price_group1).toBe(100.00);
      expect(retrieved?.sale_price_group2).toBe(90.00);
      expect(retrieved?.sale_price_group3).toBe(80.00);
      expect(retrieved?.sale_price_group4).toBe(70.00);
    });

    it('should handle decimal prices correctly', async () => {
      const item: CreateItemInput = {
        ean: '4444444444444',
        name: 'Decimal Price Product',
        vat_rate: 2,
        unit_of_measure: 'kg',
        sale_price_group1: 123.45,
        sale_price_group2: 119.99,
        sale_price_group3: 115.00,
        sale_price_group4: 110.50,
      };

      await itemService.create(item);

      const retrieved = await itemService.getOne('4444444444444');
      expect(retrieved?.sale_price_group1).toBe(123.45);
      expect(retrieved?.sale_price_group2).toBe(119.99);
    });
  });

  describe('getAll', () => {
    it('should return empty array when no items exist', async () => {
      const items = await itemService.getAll();

      expect(items).toEqual([]);
    });

    it('should return all items', async () => {
      const item1: CreateItemInput = {
        ean: '1111111111111',
        name: 'Product 1',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 100.00,
        sale_price_group2: 100.00,
        sale_price_group3: 100.00,
        sale_price_group4: 100.00,
      };

      const item2: CreateItemInput = {
        ean: '2222222222222',
        name: 'Product 2',
        category: 'Food',
        vat_rate: 1,
        unit_of_measure: 'kg',
        sale_price_group1: 50.00,
        sale_price_group2: 50.00,
        sale_price_group3: 50.00,
        sale_price_group4: 50.00,
      };

      await itemService.create(item1);
      await itemService.create(item2);

      const items = await itemService.getAll();

      expect(items).toHaveLength(2);
      expect(items[0].name).toBe('Product 1');
      expect(items[1].name).toBe('Product 2');
      expect(items[1].category).toBe('Food');
    });

    it('should include all item fields', async () => {
      const fullItem: CreateItemInput = {
        ean: '5555555555555',
        name: 'Full Item',
        category: 'Test Category',
        note: 'Test note',
        vat_rate: 2,
        unit_of_measure: 'm',
        sale_price_group1: 200.00,
        sale_price_group2: 180.00,
        sale_price_group3: 160.00,
        sale_price_group4: 140.00,
      };

      await itemService.create(fullItem);

      const items = await itemService.getAll();

      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        ean: '5555555555555',
        name: 'Full Item',
        category: 'Test Category',
        note: 'Test note',
        vat_rate: 2,
        unit_of_measure: 'm',
        sale_price_group1: 200.00,
      });
    });
  });

  describe('getOne', () => {
    it('should return undefined for non-existent item', async () => {
      const item = await itemService.getOne('9999999999999');

      expect(item).toBeUndefined();
    });

    it('should return item by EAN', async () => {
      const newItem: CreateItemInput = {
        ean: '6666666666666',
        name: 'Specific Product',
        category: 'Electronics',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 150.00,
        sale_price_group2: 150.00,
        sale_price_group3: 150.00,
        sale_price_group4: 150.00,
      };

      await itemService.create(newItem);

      const item = await itemService.getOne('6666666666666');

      expect(item).toBeDefined();
      expect(item?.ean).toBe('6666666666666');
      expect(item?.name).toBe('Specific Product');
      expect(item?.category).toBe('Electronics');
    });
  });

  describe('getCategories', () => {
    it('should return empty array when no items exist', async () => {
      const categories = await itemService.getCategories();

      expect(categories).toEqual([]);
    });

    it('should return unique categories', async () => {
      const items: CreateItemInput[] = [
        {
          ean: '1000000000001',
          name: 'Item 1',
          category: 'Electronics',
          vat_rate: 2,
          unit_of_measure: 'ks',
          sale_price_group1: 100,
          sale_price_group2: 100,
          sale_price_group3: 100,
          sale_price_group4: 100,
        },
        {
          ean: '1000000000002',
          name: 'Item 2',
          category: 'Food',
          vat_rate: 1,
          unit_of_measure: 'kg',
          sale_price_group1: 50,
          sale_price_group2: 50,
          sale_price_group3: 50,
          sale_price_group4: 50,
        },
        {
          ean: '1000000000003',
          name: 'Item 3',
          category: 'Electronics',
          vat_rate: 2,
          unit_of_measure: 'ks',
          sale_price_group1: 150,
          sale_price_group2: 150,
          sale_price_group3: 150,
          sale_price_group4: 150,
        },
        {
          ean: '1000000000004',
          name: 'Item 4',
          category: 'Clothing',
          vat_rate: 2,
          unit_of_measure: 'ks',
          sale_price_group1: 200,
          sale_price_group2: 200,
          sale_price_group3: 200,
          sale_price_group4: 200,
        },
      ];

      for (const item of items) {
        await itemService.create(item);
      }

      const categories = await itemService.getCategories();

      expect(categories).toHaveLength(3);
      expect(categories).toContain('Electronics');
      expect(categories).toContain('Food');
      expect(categories).toContain('Clothing');
    });

    it('should not include null categories', async () => {
      const items: CreateItemInput[] = [
        {
          ean: '2000000000001',
          name: 'Item with category',
          category: 'Books',
          vat_rate: 2,
          unit_of_measure: 'ks',
          sale_price_group1: 100,
          sale_price_group2: 100,
          sale_price_group3: 100,
          sale_price_group4: 100,
        },
        {
          ean: '2000000000002',
          name: 'Item without category',
          category: undefined,
          vat_rate: 2,
          unit_of_measure: 'ks',
          sale_price_group1: 100,
          sale_price_group2: 100,
          sale_price_group3: 100,
          sale_price_group4: 100,
        },
      ];

      for (const item of items) {
        await itemService.create(item);
      }

      const categories = await itemService.getCategories();

      expect(categories).toHaveLength(1);
      expect(categories).toContain('Books');
    });
  });

  describe('update', () => {
    it('should update item fields', async () => {
      const original: CreateItemInput = {
        ean: '7777777777777',
        name: 'Original Name',
        category: 'Old Category',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 100.00,
        sale_price_group2: 100.00,
        sale_price_group3: 100.00,
        sale_price_group4: 100.00,
      };

      await itemService.create(original);

      const updates = {
        name: 'Updated Name',
        category: 'New Category',
        sale_price_group1: 120.00,
      };

      const result = await itemService.update('7777777777777', updates);

      expect(result.changes).toBe(1);

      const updated = await itemService.getOne('7777777777777');
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.category).toBe('New Category');
      expect(updated?.sale_price_group1).toBe(120.00);
      expect(updated?.sale_price_group2).toBe(100.00); // Unchanged
    });

    it('should not update EAN', async () => {
      const original: CreateItemInput = {
        ean: '8888888888888',
        name: 'Product',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 100.00,
        sale_price_group2: 100.00,
        sale_price_group3: 100.00,
        sale_price_group4: 100.00,
      };

      await itemService.create(original);

      const updates = {
        ean: '9999999999999',
        name: 'Updated Product',
      } as Partial<Item>;

      await itemService.update('8888888888888', updates);

      const updated = await itemService.getOne('8888888888888');
      expect(updated?.ean).toBe('8888888888888');
      expect(updated?.name).toBe('Updated Product');
    });

    it('should update all price groups', async () => {
      const original: CreateItemInput = {
        ean: '1010101010101',
        name: 'Product',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 100.00,
        sale_price_group2: 100.00,
        sale_price_group3: 100.00,
        sale_price_group4: 100.00,
      };

      await itemService.create(original);

      const updates = {
        sale_price_group1: 110.00,
        sale_price_group2: 105.00,
        sale_price_group3: 100.00,
        sale_price_group4: 95.00,
      };

      await itemService.update('1010101010101', updates);

      const updated = await itemService.getOne('1010101010101');
      expect(updated?.sale_price_group1).toBe(110.00);
      expect(updated?.sale_price_group2).toBe(105.00);
      expect(updated?.sale_price_group3).toBe(100.00);
      expect(updated?.sale_price_group4).toBe(95.00);
    });

    it('should throw error when updating non-existent item', async () => {
      const updates = { name: 'New Name' };

      await expect(
        itemService.update('9999999999999', updates)
      ).rejects.toThrow();
    });

    it('should handle null values in updates', async () => {
      const original: CreateItemInput = {
        ean: '2020202020202',
        name: 'Product',
        category: 'Category',
        note: 'Note',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 100.00,
        sale_price_group2: 100.00,
        sale_price_group3: 100.00,
        sale_price_group4: 100.00,
      };

      await itemService.create(original);

      const updates = {
        category: undefined,
        note: undefined,
      };

      await itemService.update('2020202020202', updates);

      const updated = await itemService.getOne('2020202020202');
      expect(updated?.category).toBeNull();
      expect(updated?.note).toBeNull();
    });

    it('should throw error when no fields to update', async () => {
      const original: CreateItemInput = {
        ean: '3030303030303',
        name: 'Product',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 100.00,
        sale_price_group2: 100.00,
        sale_price_group3: 100.00,
        sale_price_group4: 100.00,
      };

      await itemService.create(original);

      await expect(
        itemService.update('3030303030303', {})
      ).rejects.toThrow('No fields to update');
    });

    it('should update VAT rate', async () => {
      const original: CreateItemInput = {
        ean: '4040404040404',
        name: 'Product',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 100.00,
        sale_price_group2: 100.00,
        sale_price_group3: 100.00,
        sale_price_group4: 100.00,
      };

      await itemService.create(original);

      await itemService.update('4040404040404', { vat_rate: 1 });

      const updated = await itemService.getOne('4040404040404');
      expect(updated?.vat_rate).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete existing item', async () => {
      const item: CreateItemInput = {
        ean: '5050505050505',
        name: 'To Delete',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 100.00,
        sale_price_group2: 100.00,
        sale_price_group3: 100.00,
        sale_price_group4: 100.00,
      };

      await itemService.create(item);

      const result = await itemService.delete('5050505050505');

      expect(result.changes).toBe(1);

      const deleted = await itemService.getOne('5050505050505');
      expect(deleted).toBeUndefined();
    });

    it('should throw error when deleting non-existent item', async () => {
      await expect(
        itemService.delete('9999999999999')
      ).rejects.toThrow();
    });
  });
});