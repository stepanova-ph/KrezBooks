export const stockMovementQueries = {
	createTable: `
    CREATE TABLE IF NOT EXISTS stock_movements (
      invoice_prefix TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      item_ean TEXT NOT NULL,
      amount TEXT NOT NULL,
      price_per_unit TEXT NOT NULL,
      vat_rate INTEGER NOT NULL,
      reset_point INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (invoice_prefix, invoice_number, item_ean),
      FOREIGN KEY (invoice_prefix, invoice_number) REFERENCES invoices(prefix, number) ON DELETE CASCADE,
      FOREIGN KEY (item_ean) REFERENCES items(ean) ON DELETE RESTRICT
    )
  `,

	getAll: `
    SELECT * FROM stock_movements 
    ORDER BY created_at DESC
  `,

	getOne: `
    SELECT * FROM stock_movements
    WHERE invoice_prefix = ? AND invoice_number = ? AND item_ean = ?
  `,

	getByInvoice: `
    SELECT * FROM stock_movements
    WHERE invoice_prefix = ? AND invoice_number = ?
    ORDER BY item_ean
  `,

	create: `
    INSERT INTO stock_movements (
      invoice_prefix,
      invoice_number,
      item_ean,
      amount,
      price_per_unit,
      vat_rate,
      reset_point
    ) VALUES (
      @invoice_prefix,
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
    WHERE invoice_prefix = ? AND invoice_number = ? AND item_ean = ?
  `,

	deleteByInvoice: `
    DELETE FROM stock_movements
    WHERE invoice_prefix = ? AND invoice_number = ?
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
      JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
      WHERE sm.item_ean = ?
        AND (i.type = 1 OR i.type = 2)
        AND sm.created_at >= COALESCE(
          (SELECT created_at 
          FROM stock_movements 
          WHERE item_ean = ? AND reset_point = 1 
          ORDER BY created_at DESC 
          LIMIT 1),
          '1970-01-01'
        )
  `,

	getLastBuyPriceByItem: `
    SELECT COALESCE(
      (SELECT CAST(sm.price_per_unit AS REAL)
      FROM stock_movements sm
      JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
      WHERE sm.item_ean = ?
        AND (i.type = 1 OR i.type = 2)
      ORDER BY i.date_issue DESC, sm.created_at DESC
      LIMIT 1),
      0
    ) as last_price
  `,

	getByItemWithInvoiceInfo: `
		SELECT 
			sm.invoice_prefix,
			sm.invoice_number,
			sm.item_ean,
			sm.amount,
			sm.price_per_unit,
			sm.vat_rate,
			sm.reset_point,
			sm.created_at,
			i.date_issue,
			i.type as invoice_type,
			i.ico as contact_ico
		FROM stock_movements sm
		JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
		WHERE sm.item_ean = ?
		ORDER BY i.date_issue DESC, sm.created_at DESC
	`,
};
