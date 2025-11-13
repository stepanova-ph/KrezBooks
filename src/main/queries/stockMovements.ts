export const stockMovementQueries = {
	createTable: `
    CREATE TABLE IF NOT EXISTS stock_movements (
      invoice_number TEXT NOT NULL,
      item_ean TEXT NOT NULL,
      amount TEXT NOT NULL,
      price_per_unit TEXT NOT NULL,
      vat_rate INTEGER NOT NULL,
      reset_point BOOLEAN DEFAULT 0,
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
      price_per_unit,
      vat_rate,
      reset_point
    ) VALUES (
      @invoice_number,
      @item_ean,
      @amount,
      @price_per_unit,
      @vat_rate,
      @reset_point
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

	getByItem: `
    SELECT * FROM stock_movements 
    WHERE item_ean = ?
    ORDER BY created_at DESC
  `,

	getStockAmountByItem: `
    SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) as total_amount
    FROM stock_movements
    WHERE item_ean = ?
  `,

	getAverageBuyPriceByItem: `
    SELECT COALESCE(
      SUM(CAST(sm.amount AS REAL) * CAST(sm.price_per_unit AS REAL)) / 
      NULLIF(SUM(CAST(sm.amount AS REAL)), 0),
      0
    ) as avg_price
    FROM stock_movements sm
    JOIN invoices i ON sm.invoice_number = i.number
    WHERE sm.item_ean = ?
      AND (i.type = 1 OR i.type = 2)
  `,

	getLastBuyPriceByItem: `
    SELECT COALESCE(
      (SELECT CAST(sm.price_per_unit AS REAL)
      FROM stock_movements sm
      JOIN invoices i ON sm.invoice_number = i.number
      WHERE sm.item_ean = ?
        AND (i.type = 1 OR i.type = 2)
      ORDER BY i.date_issue DESC, sm.created_at DESC
      LIMIT 1),
      0
    ) as last_price
  `,
};
