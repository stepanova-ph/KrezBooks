import { vatRateCaseStatement } from "../../utils/queryUtils";

export const invoiceQueries = {
	createTable: `
    CREATE TABLE IF NOT EXISTS invoices (
      number TEXT NOT NULL,
      prefix TEXT NOT NULL,
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

      PRIMARY KEY (number, prefix),
      CONSTRAINT check_type CHECK (type BETWEEN 1 AND 5),
      CONSTRAINT check_payment_method CHECK (payment_method IN (0, 1) OR payment_method IS NULL)
    )
  `,

	getAll: `
    SELECT
      i.*,
      COALESCE(
        SUM(ABS(CAST(sm.amount AS REAL)) * CAST(sm.price_per_unit AS REAL)),
        0
      ) as total_without_vat,
      COALESCE(
        SUM(
          ABS(CAST(sm.amount AS REAL)) * CAST(sm.price_per_unit AS REAL) *
          (1 + CASE sm.vat_rate
            ${vatRateCaseStatement}
            ELSE 0.0
          END)
        ),
        0
      ) as total_with_vat
    FROM invoices i
    LEFT JOIN stock_movements sm ON i.prefix = sm.invoice_prefix AND i.number = sm.invoice_number
    GROUP BY i.prefix, i.number
    ORDER BY i.date_issue DESC, i.number DESC
  `,

	getOne: `
    SELECT
      i.*,
      COALESCE(
        SUM(ABS(CAST(sm.amount AS REAL)) * CAST(sm.price_per_unit AS REAL)),
        0
      ) as total_without_vat,
      COALESCE(
        SUM(
          ABS(CAST(sm.amount AS REAL)) * CAST(sm.price_per_unit AS REAL) *
          (1 + CASE sm.vat_rate
            ${vatRateCaseStatement}
            ELSE 0.0
          END)
        ),
        0
      ) as total_with_vat
    FROM invoices i
    LEFT JOIN stock_movements sm ON i.prefix = sm.invoice_prefix AND i.number = sm.invoice_number
    WHERE i.number = ? AND i.prefix = ?
    GROUP BY i.prefix, i.number
  `,

	create: `
    INSERT INTO invoices (
      number,
      prefix,
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
      @prefix,
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
    WHERE prefix = ? AND number = ?
  `,

	getMaxNumberByType: `
    SELECT COALESCE(MAX(CAST(number AS INTEGER)), 0) as max_num
    FROM invoices
    WHERE type = ?
      AND number GLOB '[0-9]*'
  `,
};
