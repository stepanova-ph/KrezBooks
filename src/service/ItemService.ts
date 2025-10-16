import { getDatabase } from "../main/database";
import { itemQueries } from "../main/queries";
import { Item, CreateItemInput } from "../types/database";

export class ItemService {
  async getAll(): Promise<Item[]> {
    const db = getDatabase();
    const statement = db.prepare(itemQueries.getAll);
    const items = statement.all();
    return items as Item[];
  }

  async getOne(id: number): Promise<Item | undefined> {
    const db = getDatabase();
    const statement = db.prepare(itemQueries.getOne);
    const item = statement.get(id);
    return item as Item | undefined;
  }

  async create(item: CreateItemInput): Promise<{ id: number; changes: number }> {
    const db = getDatabase();
    const statement = db.prepare(itemQueries.create);
    
    const itemData = {
      sales_group: item.sales_group || null,
      name: item.name,
      note: item.note || null,
      vat_rate: item.vat_rate,
      avg_purchase_price: item.avg_purchase_price,
      last_purchase_price: item.last_purchase_price,
      unit_of_measure: item.unit_of_measure,
      sale_price_group1: item.sale_price_group1,
      sale_price_group2: item.sale_price_group2,
      sale_price_group3: item.sale_price_group3,
      sale_price_group4: item.sale_price_group4,
    };
    
    const result = statement.run(itemData);
    
    return { 
      id: result.lastInsertRowid as number, 
      changes: result.changes 
    };
  }

  async update(id: number, updates: Partial<Item>): Promise<{ changes: number }> {
    const db = getDatabase();
    
    const fieldsToUpdate = Object.keys(updates).filter(
      key => key !== 'id' && key !== 'created_at' && key !== 'updated_at'
    );
    
    if (fieldsToUpdate.length === 0) {
      throw new Error('No fields to update');
    }

    const sql = this.buildUpdateQuery('items', fieldsToUpdate);
    const statement = db.prepare(sql);
    
    const updateData: any = { id };
    for (const field of fieldsToUpdate) {
      updateData[field] = (updates as any)[field] ?? null;
    }
    
    const result = statement.run(updateData);
    
    return { changes: result.changes };
  }

  async delete(id: number): Promise<{ changes: number }> {
    const db = getDatabase();
    const statement = db.prepare(itemQueries.delete);
    const result = statement.run(id);
    return { changes: result.changes };
  }

  private buildUpdateQuery(tableName: string, fields: string[]): string {
    // Whitelist allowed fields
    const allowedFields = new Set([
      'sales_group', 'name', 'note', 'vat_rate',
      'avg_purchase_price', 'last_purchase_price', 'unit_of_measure',
      'sale_price_group1', 'sale_price_group2', 'sale_price_group3', 'sale_price_group4'
    ]);
    
    const validFields = fields.filter(f => allowedFields.has(f));
    if (validFields.length !== fields.length) {
      throw new Error('Invalid field names detected');
    }
    
    const setClause = validFields.map(field => `${field} = @${field}`).join(', ');
    
    return `
      UPDATE ${tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `;
  }
}