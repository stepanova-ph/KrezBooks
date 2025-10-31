export const itemQueries = {
	createTable: `
    CREATE TABLE IF NOT EXISTS items (
      ean TEXT PRIMARY KEY NOT NULL,
      category TEXT,
      name TEXT NOT NULL,
      note TEXT,
      vat_rate INTEGER NOT NULL DEFAULT 1,
      unit_of_measure TEXT NOT NULL DEFAULT 'ks',
      sale_price_group1 INTEGER NOT NULL DEFAULT 0,
      sale_price_group2 INTEGER NOT NULL DEFAULT 0,
      sale_price_group3 INTEGER NOT NULL DEFAULT 0,
      sale_price_group4 INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT check_vat_rate CHECK (vat_rate IN (0, 1, 2))
    )
  `,

	getAll: `
    SELECT * FROM items 
    ORDER BY name
  `,

	getOne: `
    SELECT * FROM items 
    WHERE ean = ?
  `,

	create: `
    INSERT INTO items (
      ean,
      category, 
      name, 
      note, 
      vat_rate, 
      unit_of_measure, 
      sale_price_group1,
      sale_price_group2, 
      sale_price_group3, 
      sale_price_group4
    ) VALUES (
      @ean,
      @category, 
      @name, 
      @note, 
      @vat_rate, 
      @unit_of_measure, 
      @sale_price_group1,
      @sale_price_group2, 
      @sale_price_group3, 
      @sale_price_group4
    )
  `,

	delete: `
    DELETE FROM items 
    WHERE ean = ?
  `,

	getCategories: `
    SELECT DISTINCT category 
    FROM items 
    WHERE category IS NOT NULL 
      AND category != '' 
    ORDER BY category
  `,
};
