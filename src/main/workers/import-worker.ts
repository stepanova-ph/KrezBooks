import { parentPort, workerData } from "worker_threads";
import Database from "better-sqlite3";
import { contactSchema } from "../../validation/contactSchema";
import { itemSchema } from "../../validation/itemSchema";
import { invoiceSchema } from "../../validation/invoiceSchema";
import { stockMovementSchema } from "../../validation/stockMovementSchema";
import { contactQueries } from "../queries/contacts";
import { itemQueries } from "../queries/items";
import { invoiceQueries } from "../queries/invoices";
import { stockMovementQueries } from "../queries/stockMovements";
import fs from "fs";
import path from "path";

// =============================================================================
// TYPES
// =============================================================================

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
				if (i + 1 < line.length && line[i + 1] === '"') {
					current += '"';
					i += 2;
					continue;
				} else {
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

	values.push(current);
	return values;
}

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
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
// ROW CONVERSION
// =============================================================================

function rowToObject(row: string[], headers: string[]): Record<string, string> {
	const obj: Record<string, string> = {};
	for (let i = 0; i < headers.length; i++) {
		obj[headers[i]] = row[i] || "";
	}
	return obj;
}

function parseValue(value: string): unknown {
	if (value === "") return null;
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

function importContactsTable(filePath: string, db: Database.Database): TableImportResult {
	const content = fs.readFileSync(filePath, "utf-8");
	const { headers, rows } = parseCSV(content);

	const errors: ImportError[] = [];
	let imported = 0;

	if (rows.length === 0) {
		return { imported: 0, skipped: 0, errors: [] };
	}

	const insertStmt = db.prepare(contactQueries.create);

	const BATCH_SIZE = 100;
	for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
		const batchEnd = Math.min(batchStart + BATCH_SIZE, rows.length);

		const transaction = db.transaction(() => {
			for (let i = batchStart; i < batchEnd; i++) {
				const rowNumber = i + 2;
				const row = rows[i];
				const rawRow = row.join(CSV_DELIMITER);

				try {
					const data = rowToDbObject(row, headers);

					const validationResult = contactSchema.safeParse(data);
					if (!validationResult.success) {
						const validationErrors = validationResult.error.issues.map(
							(e: any) => `${e.path.join(".")}: ${e.message}`,
						);
						errors.push({
							table: "contacts",
							rowNumber,
							rawRow,
							issues: validationErrors,
						});
						continue;
					}

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
		});

		transaction();
	}

	return { imported, skipped: errors.length, errors };
}

function importItemsTable(filePath: string, db: Database.Database): TableImportResult {
	const content = fs.readFileSync(filePath, "utf-8");
	const { headers, rows } = parseCSV(content);

	const errors: ImportError[] = [];
	let imported = 0;

	if (rows.length === 0) {
		return { imported: 0, skipped: 0, errors: [] };
	}

	const insertStmt = db.prepare(itemQueries.create);

	const BATCH_SIZE = 100;
	for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
		const batchEnd = Math.min(batchStart + BATCH_SIZE, rows.length);

		const transaction = db.transaction(() => {
			for (let i = batchStart; i < batchEnd; i++) {
				const rowNumber = i + 2;
				const row = rows[i];
				const rawRow = row.join(CSV_DELIMITER);

				try {
					const data = rowToDbObject(row, headers);

					const validationResult = itemSchema.safeParse(data);
					if (!validationResult.success) {
						const validationErrors = validationResult.error.issues.map(
							(e: any) => `${e.path.join(".")}: ${e.message}`,
						);
						errors.push({
							table: "items",
							rowNumber,
							rawRow,
							issues: validationErrors,
						});
						continue;
					}

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
		});

		transaction();
	}

	return { imported, skipped: errors.length, errors };
}

function importInvoicesTable(filePath: string, db: Database.Database): TableImportResult {
	const content = fs.readFileSync(filePath, "utf-8");
	const { headers, rows } = parseCSV(content);

	const errors: ImportError[] = [];
	let imported = 0;

	if (rows.length === 0) {
		return { imported: 0, skipped: 0, errors: [] };
	}

	const insertStmt = db.prepare(invoiceQueries.create);

	const BATCH_SIZE = 100;
	for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
		const batchEnd = Math.min(batchStart + BATCH_SIZE, rows.length);

		const transaction = db.transaction(() => {
			for (let i = batchStart; i < batchEnd; i++) {
				const rowNumber = i + 2;
				const row = rows[i];
				const rawRow = row.join(CSV_DELIMITER);

				try {
					const data = rowToDbObject(row, headers);

					const validationResult = invoiceSchema.safeParse(data);
					if (!validationResult.success) {
						const validationErrors = validationResult.error.issues.map(
							(e: any) => `${e.path.join(".")}: ${e.message}`,
						);
						errors.push({
							table: "invoices",
							rowNumber,
							rawRow,
							issues: validationErrors,
						});
						continue;
					}

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
		});

		transaction();
	}

	return { imported, skipped: errors.length, errors };
}

function importStockMovementsTable(filePath: string, db: Database.Database): TableImportResult {
	const content = fs.readFileSync(filePath, "utf-8");
	const { headers, rows } = parseCSV(content);

	const errors: ImportError[] = [];
	let imported = 0;

	if (rows.length === 0) {
		return { imported: 0, skipped: 0, errors: [] };
	}

	const insertStmt = db.prepare(stockMovementQueries.create);

	const BATCH_SIZE = 100;
	for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
		const batchEnd = Math.min(batchStart + BATCH_SIZE, rows.length);

		const transaction = db.transaction(() => {
			for (let i = batchStart; i < batchEnd; i++) {
				const rowNumber = i + 2;
				const row = rows[i];
				const rawRow = row.join(CSV_DELIMITER);

				try {
					const data = rowToDbObject(row, headers);

					const validationResult = stockMovementSchema.safeParse(data);
					if (!validationResult.success) {
						const validationErrors = validationResult.error.issues.map(
							(e: any) => `${e.path.join(".")}: ${e.message}`,
						);
						errors.push({
							table: "stock_movements",
							rowNumber,
							rawRow,
							issues: validationErrors,
						});
						continue;
					}

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
		});

		transaction();
	}

	return { imported, skipped: errors.length, errors };
}

// =============================================================================
// WORKER MAIN
// =============================================================================

async function writeErrorLog(filePath: string, errors: ImportError[]): Promise<void> {
	if (errors.length === 0) return;

	const lines = [
		`Import Error Log - ${new Date().toISOString()}`,
		`Total errors: ${errors.length}`,
		"=".repeat(80),
		"",
	];

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

	await fs.promises.writeFile(filePath, lines.join("\n"), "utf-8");
}

if (parentPort) {
	const { folderPath, dbPath } = workerData;

	(async () => {
	try {
		// Create worker's own database connection
		const db = new Database(dbPath);
		db.pragma("foreign_keys = ON");

		const contactsFile = path.join(folderPath, "contacts.csv");
		const itemsFile = path.join(folderPath, "items.csv");
		const invoicesFile = path.join(folderPath, "invoices.csv");
		const stockMovementsFile = path.join(folderPath, "stock_movements.csv");

		const hasContacts = fs.existsSync(contactsFile);
		const hasItems = fs.existsSync(itemsFile);
		const hasInvoices = fs.existsSync(invoicesFile);
		const hasStockMovements = fs.existsSync(stockMovementsFile);

		const allErrors: ImportError[] = [];
		const imported = {
			contacts: 0,
			items: 0,
			invoices: 0,
			stock_movements: 0,
		};
		const skipped = { contacts: 0, items: 0, invoices: 0, stock_movements: 0 };

		const totalSteps = [
			hasContacts,
			hasItems,
			hasInvoices,
			hasStockMovements,
		].filter(Boolean).length;
		let currentStep = 0;

		if (hasContacts) {
			currentStep++;
			const progress = Math.round((currentStep / totalSteps) * 100);
			parentPort!.postMessage({
				type: "progress",
				message: "Importuji kontakty...",
				progress,
			});
			const result = importContactsTable(contactsFile, db);
			imported.contacts = result.imported;
			skipped.contacts = result.skipped;
			allErrors.push(...result.errors);
		}

		if (hasItems) {
			currentStep++;
			const progress = Math.round((currentStep / totalSteps) * 100);
			parentPort!.postMessage({
				type: "progress",
				message: "Importuji položky...",
				progress,
			});
			const result = importItemsTable(itemsFile, db);
			imported.items = result.imported;
			skipped.items = result.skipped;
			allErrors.push(...result.errors);
		}

		if (hasInvoices) {
			currentStep++;
			const progress = Math.round((currentStep / totalSteps) * 100);
			parentPort!.postMessage({
				type: "progress",
				message: "Importuji doklady...",
				progress,
			});
			const result = importInvoicesTable(invoicesFile, db);
			imported.invoices = result.imported;
			skipped.invoices = result.skipped;
			allErrors.push(...result.errors);
		}

		if (hasStockMovements) {
			currentStep++;
			const progress = Math.round((currentStep / totalSteps) * 100);
			parentPort!.postMessage({
				type: "progress",
				message: "Importuji pohyby skladu...",
				progress,
			});
			const result = importStockMovementsTable(stockMovementsFile, db);
			imported.stock_movements = result.imported;
			skipped.stock_movements = result.skipped;
			allErrors.push(...result.errors);
		}

		// Close worker's database connection
		db.close();

		let logFile: string | undefined;
		if (allErrors.length > 0) {
			const timestamp = Date.now();
			logFile = path.join(folderPath, `import-errors-${timestamp}.log`);
			await writeErrorLog(logFile, allErrors);
		}

		parentPort!.postMessage({
			type: "progress",
			message: "Import dokončen",
			progress: 100,
		});

		parentPort!.postMessage({
			type: "complete",
			result: {
				success: true,
				imported,
				skipped,
				logFile,
			},
		});
	} catch (error: any) {
		parentPort!.postMessage({
			type: "complete",
			result: {
				success: false,
				error: error.message || "Import selhal",
			},
		});
	}
	})();
}
