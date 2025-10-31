import { describe, it, expect, beforeEach } from 'vitest';
import { ContactService } from '../../service/ContactService';
import type { CreateContactInput, Contact, PriceGroup } from '../../types/database';

describe('ContactService', () => {
  let contactService: ContactService;

  beforeEach(() => {
    contactService = new ContactService();
  });

  describe('create', () => {
    it('should create a new contact', async () => {
      const newContact: CreateContactInput = {
        ico: '12345678',
        modifier: 1,
        company_name: 'Test Company',
        dic: 'CZ12345678',
        representative_name: 'John Doe',
        street: 'Test Street 123',
        city: 'Prague',
        postal_code: '12000',
        phone: '+420123456789',
        email: 'test@example.com',
        website: 'https://example.com',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
        bank_account: '1234567890/0800',
      };

      const result = await contactService.create(newContact);

      expect(result).toHaveProperty('changes');
      expect(result.changes).toBe(1);
    });

    it('should create contact with minimal required fields', async () => {
      const minimalContact: CreateContactInput = {
        ico: '87654321',
        modifier: 1,
        company_name: 'Minimal Company',
        is_supplier: false,
        is_customer: true,
        price_group: 1,
      };

      const result = await contactService.create(minimalContact);

      expect(result.changes).toBe(1);
    });

    it('should throw error for duplicate ICO+modifier', async () => {
      const contact: CreateContactInput = {
        ico: '11111111',
        modifier: 1,
        company_name: 'First Company',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      await contactService.create(contact);

      await expect(contactService.create(contact)).rejects.toThrow();
    });

    it('should allow same ICO with different modifier', async () => {
      const contact1: CreateContactInput = {
        ico: '22222222',
        modifier: 1,
        company_name: 'Company A',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      const contact2: CreateContactInput = {
        ico: '22222222',
        modifier: 2,
        company_name: 'Company B',
        is_supplier: true,
        is_customer: false,
        price_group: 2,
      };

      const result1 = await contactService.create(contact1);
      const result2 = await contactService.create(contact2);

      expect(result1.changes).toBe(1);
      expect(result2.changes).toBe(1);
    });

    it('should handle null optional fields correctly', async () => {
      const contact: CreateContactInput = {
        ico: '33333333',
        modifier: 1,
        company_name: 'Null Fields Company',
        dic: undefined,
        representative_name: undefined,
        street: undefined,
        city: undefined,
        postal_code: undefined,
        phone: undefined,
        email: undefined,
        website: undefined,
        bank_account: undefined,
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      const result = await contactService.create(contact);
      expect(result.changes).toBe(1);

      const retrieved = await contactService.getOne('33333333', 1);
      expect(retrieved).toBeDefined();
      expect(retrieved?.dic).toBeNull();
      expect(retrieved?.representative_name).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return empty array when no contacts exist', async () => {
      const contacts = await contactService.getAll();

      expect(contacts).toEqual([]);
    });

    it('should return all contacts', async () => {
      const contact1: CreateContactInput = {
        ico: '11111111',
        modifier: 1,
        company_name: 'Company 1',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      const contact2: CreateContactInput = {
        ico: '22222222',
        modifier: 1,
        company_name: 'Company 2',
        is_supplier: false,
        is_customer: true,
        price_group: 2,
      };

      await contactService.create(contact1);
      await contactService.create(contact2);

      const contacts = await contactService.getAll();

      expect(contacts).toHaveLength(2);
      expect(contacts[0].company_name).toBe('Company 1');
      expect(contacts[1].company_name).toBe('Company 2');
    });

    it('should include all contact fields', async () => {
      const fullContact: CreateContactInput = {
        ico: '12345678',
        modifier: 1,
        company_name: 'Full Contact',
        dic: 'CZ12345678',
        representative_name: 'Jane Smith',
        street: 'Main Street 1',
        city: 'Prague',
        postal_code: '11000',
        phone: '+420987654321',
        email: 'jane@example.com',
        website: 'https://fullcontact.com',
        is_supplier: true,
        is_customer: true,
        price_group: 3,
        bank_account: '9876543210/0100',
      };

      await contactService.create(fullContact);

      const contacts = await contactService.getAll();

      expect(contacts).toHaveLength(1);
      expect(contacts[0]).toMatchObject({
        ico: '12345678',
        modifier: 1,
        company_name: 'Full Contact',
        dic: 'CZ12345678',
        representative_name: 'Jane Smith',
        is_supplier: true,
        is_customer: true,
        price_group: 3,
      });
    });
  });

  describe('getOne', () => {
    it('should return undefined for non-existent contact', async () => {
      const contact = await contactService.getOne('99999999', 1);

      expect(contact).toBeUndefined();
    });

    it('should return contact by ICO and modifier', async () => {
      const newContact: CreateContactInput = {
        ico: '44444444',
        modifier: 2,
        company_name: 'Specific Company',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      await contactService.create(newContact);

      const contact = await contactService.getOne('44444444', 2);

      expect(contact).toBeDefined();
      expect(contact?.ico).toBe('44444444');
      expect(contact?.modifier).toBe(2);
      expect(contact?.company_name).toBe('Specific Company');
    });

    it('should not return contact with wrong modifier', async () => {
      const newContact: CreateContactInput = {
        ico: '55555555',
        modifier: 1,
        company_name: 'Company',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      await contactService.create(newContact);

      const contact = await contactService.getOne('55555555', 2);

      expect(contact).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update contact fields', async () => {
      const original: CreateContactInput = {
        ico: '66666666',
        modifier: 1,
        company_name: 'Original Name',
        email: 'old@example.com',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      await contactService.create(original);

      const updates = {
        company_name: 'Updated Name',
        email: 'new@example.com',
        phone: '+420111222333',
      };

      const result = await contactService.update('66666666', 1, updates);

      expect(result.changes).toBe(1);

      const updated = await contactService.getOne('66666666', 1);
      expect(updated?.company_name).toBe('Updated Name');
      expect(updated?.email).toBe('new@example.com');
      expect(updated?.phone).toBe('+420111222333');
    });

    it('should not update ICO or modifier', async () => {
      const original: CreateContactInput = {
        ico: '77777777',
        modifier: 1,
        company_name: 'Company',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      await contactService.create(original);

      // Try to update with ICO and modifier in the updates
      const updates = {
        ico: '88888888',
        modifier: 99,
        company_name: 'Updated Company',
      } as Partial<Contact>;

      await contactService.update('77777777', 1, updates);

      const updated = await contactService.getOne('77777777', 1);
      expect(updated?.ico).toBe('77777777');
      expect(updated?.modifier).toBe(1);
      expect(updated?.company_name).toBe('Updated Company');
    });

    it('should update is_supplier and is_customer', async () => {
      const original: CreateContactInput = {
        ico: '88888888',
        modifier: 1,
        company_name: 'Company',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      await contactService.create(original);

      const updates = {
        is_supplier: false,
        is_customer: true,
      };

      await contactService.update('88888888', 1, updates);

      const updated = await contactService.getOne('88888888', 1);
      expect(updated?.is_supplier).toBe(false);
      expect(updated?.is_customer).toBe(true);
    });

    it('should throw error when updating non-existent contact', async () => {
      const updates = { company_name: 'New Name' };

      await expect(
        contactService.update('99999999', 1, updates)
      ).rejects.toThrow();
    });

    it('should handle null values in updates', async () => {
      const original: CreateContactInput = {
        ico: '10101010',
        modifier: 1,
        company_name: 'Company',
        email: 'email@example.com',
        phone: '+420123456789',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      await contactService.create(original);

      const updates = {
        email: undefined,
        phone: undefined,
      } as Partial<Contact>;

      await contactService.update('10101010', 1, updates);

      const updated = await contactService.getOne('10101010', 1);
      expect(updated?.email).toBeNull();
      expect(updated?.phone).toBeNull();
    });

    it('should throw error when no fields to update', async () => {
      const original: CreateContactInput = {
        ico: '20202020',
        modifier: 1,
        company_name: 'Company',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      await contactService.create(original);

      await expect(
        contactService.update('20202020', 1, {})
      ).rejects.toThrow('No fields to update');
    });
  });

  describe('delete', () => {
    it('should delete existing contact', async () => {
      const contact: CreateContactInput = {
        ico: '30303030',
        modifier: 1,
        company_name: 'To Delete',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      await contactService.create(contact);

      const result = await contactService.delete('30303030', 1);

      expect(result.changes).toBe(1);

      const deleted = await contactService.getOne('30303030', 1);
      expect(deleted).toBeUndefined();
    });

    it('should throw error when deleting non-existent contact', async () => {
      await expect(
        contactService.delete('99999999', 1)
      ).rejects.toThrow();
    });

    it('should not delete contact with wrong modifier', async () => {
      const contact: CreateContactInput = {
        ico: '40404040',
        modifier: 1,
        company_name: 'Company',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      await contactService.create(contact);

      await expect(
        contactService.delete('40404040', 2)
      ).rejects.toThrow();

      // Original should still exist
      const existing = await contactService.getOne('40404040', 1);
      expect(existing).toBeDefined();
    });

    it('should allow deleting one modifier while keeping others', async () => {
      const contact1: CreateContactInput = {
        ico: '50505050',
        modifier: 1,
        company_name: 'Company A',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      const contact2: CreateContactInput = {
        ico: '50505050',
        modifier: 2,
        company_name: 'Company B',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
      };

      await contactService.create(contact1);
      await contactService.create(contact2);

      await contactService.delete('50505050', 1);

      const deleted = await contactService.getOne('50505050', 1);
      const remaining = await contactService.getOne('50505050', 2);

      expect(deleted).toBeUndefined();
      expect(remaining).toBeDefined();
      expect(remaining?.company_name).toBe('Company B');
    });
  });

  describe('price_group validation', () => {
    it('should accept price_group values 1-4', async () => {
      for (let priceGroup = 1; priceGroup <= 4; priceGroup++) {
        const contact: CreateContactInput = {
          ico: `${priceGroup}0000000`,
          modifier: 1,
          company_name: `Company ${priceGroup}`,
          is_supplier: true,
          is_customer: false,
          price_group: priceGroup as PriceGroup,
        };

        const result = await contactService.create(contact);
        expect(result.changes).toBe(1);

        const retrieved = await contactService.getOne(`${priceGroup}0000000`, 1);
        expect(retrieved?.price_group).toBe(priceGroup);
      }
    });
  });
});