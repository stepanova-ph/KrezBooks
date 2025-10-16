import { BrowserWindow, ipcMain } from 'electron';
import { getDatabase } from './database';
import { handleIpcRequest, IpcResponse } from './ipcWrapper';
import { contactQueries, itemQueries } from './queries';
import type { 
  Contact, 
  Item, 
  CreateContactInput, 
  CreateItemInput 
} from '../types/database';
import { logger } from './logger';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert boolean values to SQLite integers (1/0)
 */
function boolToInt(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Build a dynamic UPDATE SQL query
 */
function buildUpdateQuery(
  tableName: string, 
  fields: string[], 
  whereClause: string
): string {
  const setClause = fields.map(field => `${field} = @${field}`).join(', ');
  
  return `
    UPDATE ${tableName}
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE ${whereClause}
  `;
}

// ============================================================================
// IPC HANDLER REGISTRATION
// ============================================================================

export function registerIpcHandlers() {
  
  // --------------------------------------------------------------------------
  // DATABASE TEST
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:test', async (): Promise<IpcResponse> => {
    return handleIpcRequest(async () => {
      const db = getDatabase();
      const result = db.prepare('SELECT 1 as test').get();
      return result;
    });
  });

  // --------------------------------------------------------------------------
  // CONTACTS - GET ALL
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:contacts:getAll', async (): Promise<IpcResponse<Contact[]>> => {
    return handleIpcRequest(async () => {
      const db = getDatabase();
      const statement = db.prepare(contactQueries.getAll);
      const contacts = statement.all();
      return contacts as Contact[];
    });
  });

  // --------------------------------------------------------------------------
  // CONTACTS - GET ONE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:contacts:getOne', async (_event, ico: string, modifier: number): Promise<IpcResponse<Contact | undefined>> => {
    return handleIpcRequest(async () => {
      const db = getDatabase();
      const statement = db.prepare(contactQueries.getOne);
      const contact = statement.get(ico, modifier);
      return contact as Contact | undefined;
    });
  });

  // --------------------------------------------------------------------------
  // CONTACTS - CREATE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:contacts:create', async (_event, contact: CreateContactInput): Promise<IpcResponse<{ changes: number }>> => {
    return handleIpcRequest(async () => {
      const db = getDatabase();
      const statement = db.prepare(contactQueries.create);
      
      const contactData = {
        ico: contact.ico,
        modifier: contact.modifier,
        dic: contact.dic || null,
        company_name: contact.company_name,
        representative_name: contact.representative_name || null,
        street: contact.street || null,
        city: contact.city || null,
        postal_code: contact.postal_code || null,
        is_supplier: boolToInt(contact.is_supplier),
        is_customer: boolToInt(contact.is_customer),
        price_group: contact.price_group,
        phone: contact.phone || null,
        email: contact.email || null,
        website: contact.website || null,
        bank_account: contact.bank_account || null,
      };
      
      const result = statement.run(contactData);
      
      return { 
        changes: result.changes 
      };
    });
  });

  // --------------------------------------------------------------------------
  // CONTACTS - UPDATE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:contacts:update', async (
    _event, 
    ico: string, 
    modifier: number, 
    updates: Partial<Contact>
  ): Promise<IpcResponse<{ changes: number }>> => {
    return handleIpcRequest(async () => {
      const db = getDatabase();
      
      // Get fields to update (excluding primary keys and timestamps)
      const fieldsToUpdate = Object.keys(updates).filter(
        key => key !== 'ico' && key !== 'modifier' && key !== 'created_at' && key !== 'updated_at'
      );
      
      // Validate we have fields to update
      if (fieldsToUpdate.length === 0) {
        throw new Error('No fields to update');
      }

      // Build dynamic UPDATE query
      const sql = buildUpdateQuery(
        'contacts',
        fieldsToUpdate,
        'ico = @ico AND modifier = @modifier'
      );
      
      const statement = db.prepare(sql);

      // Prepare update data
      const updateData: any = { 
        ico, 
        modifier 
      };
      
      for (const field of fieldsToUpdate) {
        const value = (updates as any)[field];
        
        // Convert booleans to integers
        if (field === 'is_supplier' || field === 'is_customer') {
          updateData[field] = boolToInt(value);
        } else {
          updateData[field] = value ?? null;
        }
      }

      const result = statement.run(updateData);
      
      return { 
        changes: result.changes 
      };
    });
  });

  // --------------------------------------------------------------------------
  // CONTACTS - DELETE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:contacts:delete', async (
    _event, 
    ico: string, 
    modifier: number
  ): Promise<IpcResponse<{ changes: number }>> => {
    return handleIpcRequest(async () => {
      const db = getDatabase();
      const statement = db.prepare(contactQueries.delete);
      const result = statement.run(ico, modifier);
      
      return { 
        changes: result.changes 
      };
    });
  });

  // --------------------------------------------------------------------------
  // ITEMS - GET ALL
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:items:getAll', async (): Promise<IpcResponse<Item[]>> => {
    return handleIpcRequest(async () => {
      const db = getDatabase();
      const statement = db.prepare(itemQueries.getAll);
      const items = statement.all();
      return items as Item[];
    });
  });

  // --------------------------------------------------------------------------
  // ITEMS - GET ONE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:items:getOne', async (_event, id: number): Promise<IpcResponse<Item | undefined>> => {
    return handleIpcRequest(async () => {
      const db = getDatabase();
      const statement = db.prepare(itemQueries.getOne);
      const item = statement.get(id);
      return item as Item | undefined;
    });
  });

  // --------------------------------------------------------------------------
  // ITEMS - CREATE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:items:create', async (_event, item: CreateItemInput): Promise<IpcResponse<{ id: number; changes: number }>> => {
    return handleIpcRequest(async () => {
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
    });
  });

  // --------------------------------------------------------------------------
  // ITEMS - UPDATE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:items:update', async (
    _event, 
    id: number, 
    updates: Partial<Item>
  ): Promise<IpcResponse<{ changes: number }>> => {
    return handleIpcRequest(async () => {
      const db = getDatabase();
      
      // Get fields to update (excluding id and timestamps)
      const fieldsToUpdate = Object.keys(updates).filter(
        key => key !== 'id' && key !== 'created_at' && key !== 'updated_at'
      );
      
      // Validate we have fields to update
      if (fieldsToUpdate.length === 0) {
        throw new Error('No fields to update');
      }

      // Build dynamic UPDATE query
      const sql = buildUpdateQuery(
        'items',
        fieldsToUpdate,
        'id = @id'
      );
      
      const statement = db.prepare(sql);

      // Prepare update data
      const updateData: any = { id };
      
      for (const field of fieldsToUpdate) {
        updateData[field] = (updates as any)[field] ?? null;
      }

      const result = statement.run(updateData);
      
      return { 
        changes: result.changes 
      };
    });
  });

  // --------------------------------------------------------------------------
  // ITEMS - DELETE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:items:delete', async (_event, id: number): Promise<IpcResponse<{ changes: number }>> => {
    return handleIpcRequest(async () => {
      const db = getDatabase();
      const statement = db.prepare(itemQueries.delete);
      const result = statement.run(id);
      
      return { 
        changes: result.changes 
      };
    });
  });

  logger.info('✓ IPC handlers registered');
}

// Window control handlers
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});