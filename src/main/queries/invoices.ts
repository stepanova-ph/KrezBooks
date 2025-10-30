export const invoiceQueries = {
	createTable: `
    CREATE TABLE IF NOT EXISTS invoices (
      number TEXT PRIMARY KEY NOT NULL,
      type INTEGER NOT NULL,
      payment_method INTEGER,
      date_issue TEXT NOT NULL,
      date_tax TEXT,
      date_due TEXT,
      variable_symbol TEXT,
      note TEXT,
      ico TEXT,
      modifier INTEGER,
      dic TEXT,
      company_name TEXT,
      bank_account TEXT,
      street TEXT,
      city TEXT,
      postal_code TEXT,
      phone TEXT,
      email TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT check_type CHECK (type BETWEEN 1 AND 5),
      CONSTRAINT check_payment_method CHECK (payment_method IN (0, 1) OR payment_method IS NULL)
    )
  `,

	getAll: `
    SELECT * FROM invoices 
    ORDER BY date_issue DESC, number DESC
  `,

	getOne: `
    SELECT * FROM invoices 
    WHERE number = ?
  `,

	create: `
    INSERT INTO invoices (
      number,
      type,
      payment_method,
      date_issue,
      date_tax,
      date_due,
      variable_symbol,
      note,
      ico,
      modifier,
      dic,
      company_name,
      bank_account,
      street,
      city,
      postal_code,
      phone,
      email
    ) VALUES (
      @number,
      @type,
      @payment_method,
      @date_issue,
      @date_tax,
      @date_due,
      @variable_symbol,
      @note,
      @ico,
      @modifier,
      @dic,
      @company_name,
      @bank_account,
      @street,
      @city,
      @postal_code,
      @phone,
      @email
    )
  `,

	delete: `
    DELETE FROM invoices 
    WHERE number = ?
  `,
};
