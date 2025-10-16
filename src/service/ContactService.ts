import { getDatabase } from "../main/database";
import { contactQueries } from "../main/queries";
import { Contact, CreateContactInput } from "../types/database";
import { deserializeContact, serializeContact } from "../utils/typeConverters";

export class ContactService {
  async getAll(): Promise<Contact[]> {
    const db = getDatabase();
    const statement = db.prepare(contactQueries.getAll);
    const contacts = statement.all();
    return contacts.map(deserializeContact);
  }

  async getOne(ico: string, modifier: number): Promise<Contact | undefined> {
    const db = getDatabase();
    const statement = db.prepare(contactQueries.getOne);
    const contact = statement.get(ico, modifier);
    return contact ? deserializeContact(contact) : undefined;
  }

  async create(contact: CreateContactInput): Promise<{ changes: number }> {
    const db = getDatabase();
    const statement = db.prepare(contactQueries.create);
    const serialized = serializeContact(contact);
    const result = statement.run(serialized);
    return { changes: result.changes };
  }

  async update(ico: string, modifier: number, updates: Partial<Contact>): Promise<{ changes: number }> {
    const db = getDatabase();
    
    const fieldsToUpdate = Object.keys(updates).filter(
      key => key !== 'ico' && key !== 'modifier'
    );
    
    if (fieldsToUpdate.length === 0) {
      throw new Error('No fields to update');
    }

    const sql = this.buildUpdateQuery('contacts', fieldsToUpdate);
    const statement = db.prepare(sql);
    
    const serialized = serializeContact({ ico, modifier, ...updates });
    const result = statement.run(serialized);
    
    return { changes: result.changes };
  }

  async delete(ico: string, modifier: number): Promise<{ changes: number }> {
    const db = getDatabase();
    const statement = db.prepare(contactQueries.delete);
    const result = statement.run(ico, modifier);
    return { changes: result.changes };
  }

  private buildUpdateQuery(tableName: string, fields: string[]): string {
    // Whitelist allowed fields
    const allowedFields = new Set([
      'dic', 'company_name', 'representative_name', 'street', 'city',
      'postal_code', 'is_supplier', 'is_customer', 'price_group',
      'phone', 'email', 'website', 'bank_account'
    ]);
    
    const validFields = fields.filter(f => allowedFields.has(f));
    if (validFields.length !== fields.length) {
      throw new Error('Invalid field names detected');
    }
    
    const setClause = validFields.map(field => `${field} = @${field}`).join(', ');
    
    return `
      UPDATE ${tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE ico = @ico AND modifier = @modifier
    `;
  }
}