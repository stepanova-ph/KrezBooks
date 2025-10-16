import { BrowserWindow, ipcMain } from 'electron';
import { getDatabase } from './database';
import type { 
  Contact, 
  Item, 
  CreateContactInput, 
  CreateItemInput 
} from '../types/database';

// ============================================================================
// SQL QUERIES - CONTACTS
// ============================================================================

const SQL_GET_ALL_CONTACTS = `
  SELECT * FROM contacts 
  ORDER BY company_name
`;

const SQL_GET_ONE_CONTACT = `
  SELECT * FROM contacts 
  WHERE ico = ? AND modifier = ?
`;

const SQL_CREATE_CONTACT = `
  INSERT INTO contacts (
    ico, 
    modifier, 
    dic, 
    company_name, 
    representative_name,
    street, 
    city, 
    postal_code, 
    is_supplier, 
    is_customer,
    price_group, 
    phone, 
    email, 
    website, 
    bank_account
  ) VALUES (
    @ico, 
    @modifier, 
    @dic, 
    @company_name, 
    @representative_name,
    @street, 
    @city, 
    @postal_code, 
    @is_supplier, 
    @is_customer,
    @price_group, 
    @phone, 
    @email, 
    @website, 
    @bank_account
  )
`;

const SQL_DELETE_CONTACT = `
  DELETE FROM contacts 
  WHERE ico = ? AND modifier = ?
`;

// ============================================================================
// SQL QUERIES - ITEMS
// ============================================================================

const SQL_GET_ALL_ITEMS = `
  SELECT * FROM items 
  ORDER BY name
`;

const SQL_GET_ONE_ITEM = `
  SELECT * FROM items 
  WHERE id = ?
`;

const SQL_CREATE_ITEM = `
  INSERT INTO items (
    sales_group, 
    name, 
    note, 
    vat_rate, 
    avg_purchase_price,
    last_purchase_price, 
    unit_of_measure, 
    sale_price_group1,
    sale_price_group2, 
    sale_price_group3, 
    sale_price_group4
  ) VALUES (
    @sales_group, 
    @name, 
    @note, 
    @vat_rate, 
    @avg_purchase_price,
    @last_purchase_price, 
    @unit_of_measure, 
    @sale_price_group1,
    @sale_price_group2, 
    @sale_price_group3, 
    @sale_price_group4
  )
`;

const SQL_DELETE_ITEM = `
  DELETE FROM items 
  WHERE id = ?
`;

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
  
  ipcMain.handle('db:test', async () => {
    try {
      const db = getDatabase();
      const result = db.prepare('SELECT 1 as test').get();
      return { success: true, result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // --------------------------------------------------------------------------
  // CONTACTS - GET ALL
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:contacts:getAll', async () => {
    const db = getDatabase();
    const statement = db.prepare(SQL_GET_ALL_CONTACTS);
    const contacts = statement.all();
    
    return contacts as Contact[];
  });

  // --------------------------------------------------------------------------
  // CONTACTS - GET ONE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:contacts:getOne', async (_event, ico: string, modifier: number) => {
    const db = getDatabase();
    const statement = db.prepare(SQL_GET_ONE_CONTACT);
    const contact = statement.get(ico, modifier);
    
    return contact as Contact | undefined;
  });

  // --------------------------------------------------------------------------
  // CONTACTS - CREATE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:contacts:create', async (_event, contact: CreateContactInput) => {
    const db = getDatabase();
    const statement = db.prepare(SQL_CREATE_CONTACT);
    
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
      success: true, 
      changes: result.changes 
    };
  });

  // --------------------------------------------------------------------------
  // CONTACTS - UPDATE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:contacts:update', async (
    _event, 
    ico: string, 
    modifier: number, 
    updates: Partial<Contact>
  ) => {
    const db = getDatabase();
    
    // Get fields to update (excluding primary keys)
    const fieldsToUpdate = Object.keys(updates).filter(
      key => key !== 'ico' && key !== 'modifier'
    );
    
    // Validate we have fields to update
    if (fieldsToUpdate.length === 0) {
      return { 
        success: false, 
        error: 'No fields to update' 
      };
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
      success: true, 
      changes: result.changes 
    };
  });

  // --------------------------------------------------------------------------
  // CONTACTS - DELETE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:contacts:delete', async (
    _event, 
    ico: string, 
    modifier: number
  ) => {
    const db = getDatabase();
    const statement = db.prepare(SQL_DELETE_CONTACT);
    const result = statement.run(ico, modifier);
    
    return { 
      success: true, 
      changes: result.changes 
    };
  });

  // --------------------------------------------------------------------------
  // ITEMS - GET ALL
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:items:getAll', async () => {
    const db = getDatabase();
    const statement = db.prepare(SQL_GET_ALL_ITEMS);
    const items = statement.all();
    
    return items as Item[];
  });

  // --------------------------------------------------------------------------
  // ITEMS - GET ONE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:items:getOne', async (_event, id: number) => {
    const db = getDatabase();
    const statement = db.prepare(SQL_GET_ONE_ITEM);
    const item = statement.get(id);
    
    return item as Item | undefined;
  });

  // --------------------------------------------------------------------------
  // ITEMS - CREATE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:items:create', async (_event, item: CreateItemInput) => {
    const db = getDatabase();
    const statement = db.prepare(SQL_CREATE_ITEM);
    
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
      success: true, 
      id: result.lastInsertRowid, 
      changes: result.changes 
    };
  });

  // --------------------------------------------------------------------------
  // ITEMS - UPDATE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:items:update', async (
    _event, 
    id: number, 
    updates: Partial<Item>
  ) => {
    const db = getDatabase();
    
    // Get fields to update (excluding id)
    const fieldsToUpdate = Object.keys(updates).filter(
      key => key !== 'id'
    );
    
    // Validate we have fields to update
    if (fieldsToUpdate.length === 0) {
      return { 
        success: false, 
        error: 'No fields to update' 
      };
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
      success: true, 
      changes: result.changes 
    };
  });

  // --------------------------------------------------------------------------
  // ITEMS - DELETE
  // --------------------------------------------------------------------------
  
  ipcMain.handle('db:items:delete', async (_event, id: number) => {
    const db = getDatabase();
    const statement = db.prepare(SQL_DELETE_ITEM);
    const result = statement.run(id);
    
    return { 
      success: true, 
      changes: result.changes 
    };
  });

  console.log('✓ IPC handlers registered');
}


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
