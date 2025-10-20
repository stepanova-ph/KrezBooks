export const contactQueries = {
  createTable: `
    CREATE TABLE IF NOT EXISTS contacts (
      ico TEXT NOT NULL,
      modifier INTEGER NOT NULL DEFAULT 1,
      dic TEXT,
      company_name TEXT NOT NULL,
      representative_name TEXT,
      street TEXT,
      city TEXT,
      postal_code TEXT,
      is_supplier INTEGER NOT NULL DEFAULT 0,
      is_customer INTEGER NOT NULL DEFAULT 0,
      price_group INTEGER NOT NULL DEFAULT 1,
      phone TEXT,
      email TEXT,
      website TEXT,
      bank_account TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (ico, modifier),
      CONSTRAINT check_price_group CHECK (price_group BETWEEN 1 AND 4)
    )
  `,

  getAll: `
    SELECT * FROM contacts 
    ORDER BY company_name
  `,
  
  getOne: `
    SELECT * FROM contacts 
    WHERE ico = ? AND modifier = ?
  `,
  
  create: `
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
  `,
  
  delete: `
    DELETE FROM contacts 
    WHERE ico = ? AND modifier = ?
  `,
};