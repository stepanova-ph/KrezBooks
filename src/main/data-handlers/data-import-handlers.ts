import { ipcMain } from "electron";
import { getDatabase } from "../database";
import { logger } from "../logger";
import fs from "fs";
import path from "path";

// =============================================================================
// TYPES
// =============================================================================

interface ImportResult {
	success: boolean;
	canceled?: boolean;
	imported?: {
		contacts: number;
		items: number;
		invoices: number;
		stock_movements: number;
	};
	skipped?: {
		contacts: number;
		items: number;
		invoices: number;
		stock_movements: number;
	};
	logFile?: string;
	error?: string;
}

interface ImportError {
	table: string;
	rowNumber: number;
	rawRow: string;
	issues: string[];
}

interface TableImportResult {
	imported: number;
	skipped: number;
	errors: ImportError[];
}

// =============================================================================
// CSV PARSING
// =============================================================================

const CSV_DELIMITER = ";";

function parseCSVLine(line: string): string[] {
	const values: string[] = [];
	let current = "";
	let inQuotes = false;
	let i = 0;

	while (i < line.length) {
		const char = line[i];

		if (inQuotes) {
			if (char === '"') {
				// Check for escaped quote
				if (i + 1 < line.length && line[i + 1] === '"') {
					current += '"';
					i += 2;
					continue;
				} else {
					// End of quoted field
					inQuotes = false;
					i++;
					continue;
				}
			} else {
				current += char;
				i++;
			}
		} else {
			if (char === '"') {
				inQuotes = true;
				i++;
			} else if (char === CSV_DELIMITER) {
				values.push(current);
				current = "";
				i++;
			} else {
				current += char;
				i++;
			}
		}
	}

	// Push the last value
	values.push(current);

	return values;
}

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
	// Remove BOM if present
	const cleanContent = content.replace(/^\uFEFF/, "");
	const lines = cleanContent.split(/\r?\n/).filter((line) => line.trim());

	if (lines.length === 0) {
		return { headers: [], rows: [] };
	}

	const headers = parseCSVLine(lines[0]);
	const rows = lines.slice(1).map((line) => parseCSVLine(line));

	return { headers, rows };
}

// =============================================================================
// ERROR LOGGING
// =============================================================================

function writeErrorLog(filePath: string, errors: ImportError[]): void {
	if (errors.length === 0) return;

	const lines = [
		`Import Error Log - ${new Date().toISOString()}`,
		`Total errors: ${errors.length}`,
		"=".repeat(80),
		"",
	];

	// Group errors by table
	const byTable = new Map<string, ImportError[]>();
	for (const error of errors) {
		const tableErrors = byTable.get(error.table) || [];
		tableErrors.push(error);
		byTable.set(error.table, tableErrors);
	}

	for (const [table, tableErrors] of byTable) {
		lines.push(`\n[${table.toUpperCase()}] - ${tableErrors.length} errors`);
		lines.push("-".repeat(40));

		for (const error of tableErrors) {
			lines.push(`Row ${error.rowNumber}:`);
			lines.push(`  Raw data: ${error.rawRow}`);
			lines.push(`  Issues:`);
			for (const issue of error.issues) {
				lines.push(`    - ${issue}`);
			}
			lines.push("");
		}
	}

	fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
}

// =============================================================================
// ROW TO OBJECT CONVERSION
// =============================================================================

function rowToObject(row: string[], headers: string[]): Record<string, string> {
	const obj: Record<string, string> = {};
	for (let i = 0; i < headers.length; i++) {
		obj[headers[i]] = row[i] || "";
	}
	return obj;
}

function parseValue(value: string): unknown {
	// Empty string → null
	if (value === "") return null;

	// Return as string - SQLite will handle type coercion based on column affinity
	return value;
}

function rowToDbObject(
	row: string[],
	headers: string[],
): Record<string, unknown> {
	const obj: Record<string, unknown> = {};
	for (let i = 0; i < headers.length; i++) {
		obj[headers[i]] = parseValue(row[i] || "");
	}
	return obj;
}

// =============================================================================
// TABLE IMPORTERS
// =============================================================================

function importContactsTable(filePath: string): TableImportResult {
	const db = getDatabase();
	const content = fs.readFileSync(filePath, "utf-8");
	const { headers, rows } = parseCSV(content);

	const errors: ImportError[] = [];
	let imported = 0;

	if (rows.length === 0) {
		return { imported: 0, skipped: 0, errors: [] };
	}

	const insertStmt = db.prepare(`
		INSERT INTO contacts (
			ico, modifier, dic, company_name, representative_name,
			street, city, postal_code, is_supplier, is_customer,
			price_group, phone, email, website, bank_account,
			created_at, updated_at
		) VALUES (
			@ico, @modifier, @dic, @company_name, @representative_name,
			@street, @city, @postal_code, @is_supplier, @is_customer,
			@price_group, @phone, @email, @website, @bank_account,
			@created_at, @updated_at
		)
	`);

	for (let i = 0; i < rows.length; i++) {
		const rowNumber = i + 2;
		const row = rows[i];
		const rawRow = row.join(CSV_DELIMITER);

		try {
			const data = rowToDbObject(row, headers);
			insertStmt.run(data);
			imported++;
		} catch (dbError: any) {
			const errorMessage = dbError.message || "Unknown database error";
			if (
				errorMessage.includes("UNIQUE constraint failed") ||
				errorMessage.includes("PRIMARY KEY")
			) {
				const obj = rowToObject(row, headers);
				errors.push({
					table: "contacts",
					rowNumber,
					rawRow,
					issues: [
						`Duplicate contact: ICO ${obj.ico}, modifier ${obj.modifier}`,
					],
				});
			} else {
				errors.push({
					table: "contacts",
					rowNumber,
					rawRow,
					issues: [`Database error: ${errorMessage}`],
				});
			}
		}
	}

	return { imported, skipped: errors.length, errors };
}

function importItemsTable(filePath: string): TableImportResult {
	const db = getDatabase();
	const content = fs.readFileSync(filePath, "utf-8");
	const { headers, rows } = parseCSV(content);

	const errors: ImportError[] = [];
	let imported = 0;

	if (rows.length === 0) {
		return { imported: 0, skipped: 0, errors: [] };
	}

	const insertStmt = db.prepare(`
		INSERT INTO items (
			ean, category, name, note, vat_rate, unit_of_measure,
			sale_price_group1, sale_price_group2, sale_price_group3, sale_price_group4,
			created_at, updated_at
		) VALUES (
			@ean, @category, @name, @note, @vat_rate, @unit_of_measure,
			@sale_price_group1, @sale_price_group2, @sale_price_group3, @sale_price_group4,
			@created_at, @updated_at
		)
	`);

	for (let i = 0; i < rows.length; i++) {
		const rowNumber = i + 2;
		const row = rows[i];
		const rawRow = row.join(CSV_DELIMITER);

		try {
			const data = rowToDbObject(row, headers);
			insertStmt.run(data);
			imported++;
		} catch (dbError: any) {
			const errorMessage = dbError.message || "Unknown database error";
			if (
				errorMessage.includes("UNIQUE constraint failed") ||
				errorMessage.includes("PRIMARY KEY")
			) {
				const obj = rowToObject(row, headers);
				errors.push({
					table: "items",
					rowNumber,
					rawRow,
					issues: [`Duplicate EAN: ${obj.ean}`],
				});
			} else {
				errors.push({
					table: "items",
					rowNumber,
					rawRow,
					issues: [`Database error: ${errorMessage}`],
				});
			}
		}
	}

	return { imported, skipped: errors.length, errors };
}

function importInvoicesTable(filePath: string): TableImportResult {
	const db = getDatabase();
	const content = fs.readFileSync(filePath, "utf-8");
	const { headers, rows } = parseCSV(content);

	const errors: ImportError[] = [];
	let imported = 0;

	if (rows.length === 0) {
		return { imported: 0, skipped: 0, errors: [] };
	}

	const insertStmt = db.prepare(`
		INSERT INTO invoices (
			number, prefix, type, payment_method, date_issue, date_tax, date_due,
			variable_symbol, note, ico, modifier, dic, company_name, bank_account,
			street, city, postal_code, phone, email, created_at, updated_at
		) VALUES (
			@number, @prefix, @type, @payment_method, @date_issue, @date_tax, @date_due,
			@variable_symbol, @note, @ico, @modifier, @dic, @company_name, @bank_account,
			@street, @city, @postal_code, @phone, @email, @created_at, @updated_at
		)
	`);

	for (let i = 0; i < rows.length; i++) {
		const rowNumber = i + 2;
		const row = rows[i];
		const rawRow = row.join(CSV_DELIMITER);

		try {
			const data = rowToDbObject(row, headers);
			insertStmt.run(data);
			imported++;
		} catch (dbError: any) {
			const errorMessage = dbError.message || "Unknown database error";
			if (
				errorMessage.includes("UNIQUE constraint failed") ||
				errorMessage.includes("PRIMARY KEY")
			) {
				const obj = rowToObject(row, headers);
				errors.push({
					table: "invoices",
					rowNumber,
					rawRow,
					issues: [
						`Duplicate invoice: prefix ${obj.prefix}, number ${obj.number}`,
					],
				});
			} else {
				errors.push({
					table: "invoices",
					rowNumber,
					rawRow,
					issues: [`Database error: ${errorMessage}`],
				});
			}
		}
	}

	return { imported, skipped: errors.length, errors };
}

function importStockMovementsTable(filePath: string): TableImportResult {
	const db = getDatabase();
	const content = fs.readFileSync(filePath, "utf-8");
	const { headers, rows } = parseCSV(content);

	const errors: ImportError[] = [];
	let imported = 0;

	if (rows.length === 0) {
		return { imported: 0, skipped: 0, errors: [] };
	}

	const insertStmt = db.prepare(`
		INSERT INTO stock_movements (
			invoice_prefix, invoice_number, item_ean, amount, price_per_unit,
			vat_rate, reset_point, created_at
		) VALUES (
			@invoice_prefix, @invoice_number, @item_ean, @amount, @price_per_unit,
			@vat_rate, @reset_point, @created_at
		)
	`);

	for (let i = 0; i < rows.length; i++) {
		const rowNumber = i + 2;
		const row = rows[i];
		const rawRow = row.join(CSV_DELIMITER);

		try {
			const data = rowToDbObject(row, headers);
			insertStmt.run(data);
			imported++;
		} catch (dbError: any) {
			const errorMessage = dbError.message || "Unknown database error";
			if (
				errorMessage.includes("UNIQUE constraint failed") ||
				errorMessage.includes("PRIMARY KEY")
			) {
				const obj = rowToObject(row, headers);
				errors.push({
					table: "stock_movements",
					rowNumber,
					rawRow,
					issues: [
						`Duplicate stock movement: invoice ${obj.invoice_prefix}-${obj.invoice_number}, item ${obj.item_ean}`,
					],
				});
			} else if (errorMessage.includes("FOREIGN KEY constraint failed")) {
				const obj = rowToObject(row, headers);
				errors.push({
					table: "stock_movements",
					rowNumber,
					rawRow,
					issues: [
						`Foreign key error: invoice ${obj.invoice_prefix}-${obj.invoice_number} or item ${obj.item_ean} does not exist`,
					],
				});
			} else {
				errors.push({
					table: "stock_movements",
					rowNumber,
					rawRow,
					issues: [`Database error: ${errorMessage}`],
				});
			}
		}
	}

	return { imported, skipped: errors.length, errors };
}

// =============================================================================
// MAIN IMPORT FUNCTION
// =============================================================================

async function performImport(
	folderPath: string,
	progressCallback?: (message: string, progress: number) => void,
): Promise<ImportResult> {
	const contactsFile = path.join(folderPath, "contacts.csv");
	const itemsFile = path.join(folderPath, "items.csv");
	const invoicesFile = path.join(folderPath, "invoices.csv");
	const stockMovementsFile = path.join(folderPath, "stock_movements.csv");

	// Check file existence
	const hasContacts = fs.existsSync(contactsFile);
	const hasItems = fs.existsSync(itemsFile);
	const hasInvoices = fs.existsSync(invoicesFile);
	const hasStockMovements = fs.existsSync(stockMovementsFile);

	// Validate: if stock_movements exists, invoices must also exist
	if (hasStockMovements && !hasInvoices) {
		return {
			success: false,
			error: "Soubor stock_movements.csv vyžaduje také invoices.csv",
		};
	}

	// Validate: if invoices exists, stock_movements should also exist (they're paired)
	if (hasInvoices && !hasStockMovements) {
		return {
			success: false,
			error: "Soubor invoices.csv vyžaduje také stock_movements.csv",
		};
	}

	// Check if at least one file exists
	if (!hasContacts && !hasItems && !hasInvoices && !hasStockMovements) {
		return {
			success: false,
			error:
				"Složka neobsahuje žádné CSV soubory k importu (contacts.csv, items.csv, invoices.csv, stock_movements.csv)",
		};
	}

	const allErrors: ImportError[] = [];
	const imported = { contacts: 0, items: 0, invoices: 0, stock_movements: 0 };
	const skipped = { contacts: 0, items: 0, invoices: 0, stock_movements: 0 };

	const totalSteps = [
		hasContacts,
		hasItems,
		hasInvoices,
		hasStockMovements,
	].filter(Boolean).length;
	let currentStep = 0;

	// Import in order (respecting foreign keys)
	// 1. Contacts (no dependencies)
	if (hasContacts) {
		currentStep++;
		const progress = Math.round((currentStep / totalSteps) * 100);
		progressCallback?.(`Importuji kontakty...`, progress);
		logger.info("Importing contacts...");
		const result = importContactsTable(contactsFile);
		imported.contacts = result.imported;
		skipped.contacts = result.skipped;
		allErrors.push(...result.errors);
		logger.info(
			`Contacts: ${result.imported} imported, ${result.skipped} skipped`,
		);
	}

	// 2. Items (no dependencies)
	if (hasItems) {
		currentStep++;
		const progress = Math.round((currentStep / totalSteps) * 100);
		progressCallback?.(`Importuji položky...`, progress);
		logger.info("Importing items...");
		const result = importItemsTable(itemsFile);
		imported.items = result.imported;
		skipped.items = result.skipped;
		allErrors.push(...result.errors);
		logger.info(
			`Items: ${result.imported} imported, ${result.skipped} skipped`,
		);
	}

	// 3. Invoices (optional reference to contacts)
	if (hasInvoices) {
		currentStep++;
		const progress = Math.round((currentStep / totalSteps) * 100);
		progressCallback?.(`Importuji doklady...`, progress);
		logger.info("Importing invoices...");
		const result = importInvoicesTable(invoicesFile);
		imported.invoices = result.imported;
		skipped.invoices = result.skipped;
		allErrors.push(...result.errors);
		logger.info(
			`Invoices: ${result.imported} imported, ${result.skipped} skipped`,
		);
	}

	// 4. Stock movements (references invoices and items)
	if (hasStockMovements) {
		currentStep++;
		const progress = Math.round((currentStep / totalSteps) * 100);
		progressCallback?.(`Importuji pohyby skladu...`, progress);
		logger.info("Importing stock movements...");
		const result = importStockMovementsTable(stockMovementsFile);
		imported.stock_movements = result.imported;
		skipped.stock_movements = result.skipped;
		allErrors.push(...result.errors);
		logger.info(
			`Stock movements: ${result.imported} imported, ${result.skipped} skipped`,
		);
	}

	// Write error log if needed
	let logFile: string | undefined;
	if (allErrors.length > 0) {
		const timestamp = Date.now();
		logFile = path.join(folderPath, `import-errors-${timestamp}.log`);
		writeErrorLog(logFile, allErrors);
		logger.info(`Error log written to: ${logFile}`);
	}

	progressCallback?.(`Import dokončen`, 100);

	return {
		success: true,
		imported,
		skipped,
		logFile,
	};
}

// =============================================================================
// IPC HANDLER REGISTRATION
// =============================================================================

function registerDataImportHandlers() {
	ipcMain.handle("db:importData", async (event, directoryPath: string) => {
		try {
			if (!directoryPath) {
				return { success: false, error: "Nebyla vybrána složka" };
			}

			// Validate directory exists
			if (!fs.existsSync(directoryPath)) {
				return { success: false, error: "Vybraná složka neexistuje" };
			}

			logger.info(`Importing data from: ${directoryPath}`);

			// Progress callback
			const progressCallback = (message: string, progress: number) => {
				event.sender.send("import:progress", { message, progress });
			};

			// Start import asynchronously (don't await)
			performImport(directoryPath, progressCallback)
				.then((result) => {
					event.sender.send("import:complete", result);
				})
				.catch((error) => {
					event.sender.send("import:complete", {
						success: false,
						error: error.message || "Import selhal",
					});
				});

			// Return immediately to indicate import has started
			return { success: true, started: true };
		} catch (error: any) {
			logger.error("Import failed:", error);
			event.sender.send("import:progress", {
				message: `Import selhal: ${error.message}`,
				progress: 0,
			});
			return {
				success: false,
				error: error.message || "Import selhal",
			};
		}
	});
}

export { registerDataImportHandlers };
