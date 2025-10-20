export const stockMovementQueries = {
  createTable: `
    CREATE TABLE IF NOT EXISTS stock_movements (
      invoice_number TEXT NOT NULL,
      item_ean TEXT NOT NULL,
      amount TEXT NOT NULL,
      price_per_unit TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (invoice_number, item_ean),
      FOREIGN KEY (invoice_number) REFERENCES invoices(number) ON DELETE CASCADE,
      FOREIGN KEY (item_ean) REFERENCES items(ean) ON DELETE RESTRICT
    )
  `,

  getAll: `
    SELECT * FROM stock_movements 
    ORDER BY created_at DESC
  `,
  
  getOne: `
    SELECT * FROM stock_movements 
    WHERE invoice_number = ? AND item_ean = ?
  `,
  
  getByInvoice: `
    SELECT * FROM stock_movements 
    WHERE invoice_number = ?
    ORDER BY item_ean
  `,
  
  create: `
    INSERT INTO stock_movements (
      invoice_number,
      item_ean,
      amount,
      price_per_unit
    ) VALUES (
      @invoice_number,
      @item_ean,
      @amount,
      @price_per_unit
    )
  `,
  
  delete: `
    DELETE FROM stock_movements 
    WHERE invoice_number = ? AND item_ean = ?
  `,
  
  deleteByInvoice: `
    DELETE FROM stock_movements 
    WHERE invoice_number = ?
  `,
};