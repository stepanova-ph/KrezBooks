import { ipcMain, dialog, BrowserWindow } from "electron";
import { getDatabase } from "./database";
import { logger } from "./logger";
import fs from "fs";
import path from "path";

const TABLES = ["contacts", "items", "invoices", "stock_movements"] as const;
type TableName = (typeof TABLES)[number];

// UTF-8 BOM for Excel to recognize encoding
const UTF8_BOM = "\uFEFF";
const CSV_DELIMITER = ";";

function escapeCSVValue(value: unknown): string {
	if (value === null || value === undefined) {
		return "";
	}

	const stringValue = String(value);

	// Escape if contains delimiter, quotes, or newlines
	if (
		stringValue.includes(CSV_DELIMITER) ||
		stringValue.includes('"') ||
		stringValue.includes("\n") ||
		stringValue.includes("\r")
	) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}

	return stringValue;
}

function rowToCSV(row: Record<string, unknown>, columns: string[]): string {
	return columns.map((col) => escapeCSVValue(row[col])).join(CSV_DELIMITER);
}

function tableToCSV(rows: Record<string, unknown>[]): string {
	if (rows.length === 0) {
		return "";
	}

	const columns = Object.keys(rows[0]);
	const header = columns.join(CSV_DELIMITER);
	const dataRows = rows.map((row) => rowToCSV(row, columns));

	return UTF8_BOM + header + "\n" + dataRows.join("\n");
}

function exportTable(tableName: TableName): string {
	const db = getDatabase();
	const rows = db.prepare(`SELECT * FROM ${tableName}`).all() as Record<
		string,
		unknown
	>[];

	return tableToCSV(rows);
}

function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function registerDataTransferHandlers() {
	ipcMain.handle("db:exportData", async (event) => {
		try {
			const window = BrowserWindow.fromWebContents(event.sender);

			const result = await dialog.showOpenDialog(window!, {
				title: "Vyberte složku pro export",
				properties: ["openDirectory", "createDirectory"],
				buttonLabel: "Exportovat sem",
			});

			if (result.canceled || result.filePaths.length === 0) {
				return { success: false, canceled: true };
			}

			const basePath = result.filePaths[0];
			const exportFolderName = `krezbooks-export-${formatDate(new Date())}`;
			const exportPath = path.join(basePath, exportFolderName);

			// Create export directory
			if (fs.existsSync(exportPath)) {
				// Add timestamp if folder already exists
				const timestamp = Date.now();
				const uniqueExportPath = path.join(
					basePath,
					`${exportFolderName}-${timestamp}`,
				);
				fs.mkdirSync(uniqueExportPath, { recursive: true });
				return await performExport(uniqueExportPath);
			}

			fs.mkdirSync(exportPath, { recursive: true });
			return await performExport(exportPath);
		} catch (error: any) {
			logger.error("Export failed:", error);
			return {
				success: false,
				error: error.message || "Export selhal",
			};
		}
	});
}

async function performExport(
	exportPath: string,
): Promise<{ success: boolean; error?: string; path?: string }> {
	const createdFiles: string[] = [];

	try {
		for (const tableName of TABLES) {
			const csvContent = exportTable(tableName);
			const filePath = path.join(exportPath, `${tableName}.csv`);

			fs.writeFileSync(filePath, csvContent, "utf-8");
			createdFiles.push(filePath);

			logger.info(`Exported ${tableName} to ${filePath}`);
		}

		logger.info(`Export completed to ${exportPath}`);
		return { success: true, path: exportPath };
	} catch (error: any) {
		// Cleanup on failure
		logger.error("Export failed, cleaning up:", error);

		for (const file of createdFiles) {
			try {
				if (fs.existsSync(file)) {
					fs.unlinkSync(file);
				}
			} catch (cleanupError) {
				logger.error(`Failed to cleanup ${file}:`, cleanupError);
			}
		}

		// Remove the export directory if empty
		try {
			if (fs.existsSync(exportPath)) {
				const remaining = fs.readdirSync(exportPath);
				if (remaining.length === 0) {
					fs.rmdirSync(exportPath);
				}
			}
		} catch (cleanupError) {
			logger.error("Failed to cleanup export directory:", cleanupError);
		}

		throw error;
	}
}

// =============================================================================
// LEGACY IMPORT (from old app TSV format)
// =============================================================================

interface ImportResult {
	success: boolean;
	canceled?: boolean;
	imported?: number;
	skipped?: number;
	logFile?: string;
	error?: string;
}

interface ImportError {
	rowNumber: number;
	rawRow: string;
	issues: string[];
}

function parseTSV(content: string): { headers: string[]; rows: string[][] } {
	// Remove BOM if present
	const cleanContent = content.replace(/^\uFEFF/, "");
	const lines = cleanContent.split(/\r?\n/).filter((line) => line.trim());

	if (lines.length === 0) {
		return { headers: [], rows: [] };
	}

	const headers = lines[0].split("\t");
	const rows = lines.slice(1).map((line) => line.split("\t"));

	return { headers, rows };
}

function parseDecimalToHellers(value: string): number | null {
	if (!value || value.trim() === "") return 0;

	// Replace comma with dot, remove spaces
	const normalized = value.replace(",", ".").replace(/\s/g, "");
	const parsed = parseFloat(normalized);

	if (isNaN(parsed)) return null;

	// Convert to hellers (multiply by 100)
	return Math.round(parsed * 100);
}

function parseVatRate(value: string): number | null {
	const trimmed = value.trim();
	if (trimmed === "21 %" || trimmed === "21%") return 2;
	if (trimmed === "12 %" || trimmed === "12%") return 1;
	if (trimmed === "0 %" || trimmed === "0%") return 0;
	return null;
}

function parseContactType(value: string): { is_supplier: number; is_customer: number } | null {
	const trimmed = value.trim().toUpperCase();
	if (trimmed === "O") return { is_supplier: 0, is_customer: 1 };
	if (trimmed === "DO") return { is_supplier: 1, is_customer: 0 };
	if (trimmed === "ODO" || trimmed === "DOO") return { is_supplier: 1, is_customer: 1 };
	return null;
}

function stripPSCSpaces(value: string): string {
	return value.replace(/\s/g, "");
}

function combineBankAccount(accountNumber: string, bankCode: string): string | null {
	const account = accountNumber?.trim();
	const code = bankCode?.trim();

	if (!account && !code) return null;
	if (!account) return null;
	if (!code) return account;

	return `${account}/${code}`;
}

function writeErrorLog(filePath: string, errors: ImportError[]): void {
	if (errors.length === 0) return;

	const lines = [
		`Import Error Log - ${new Date().toISOString()}`,
		`Total errors: ${errors.length}`,
		"=".repeat(80),
		"",
	];

	for (const error of errors) {
		lines.push(`Row ${error.rowNumber}:`);
		lines.push(`  Raw data: ${error.rawRow}`);
		lines.push(`  Issues:`);
		for (const issue of error.issues) {
			lines.push(`    - ${issue}`);
		}
		lines.push("");
	}

	fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
}

function getColumnIndex(headers: string[], columnName: string): number {
	return headers.findIndex((h) => h.trim() === columnName);
}

function getColumnValue(row: string[], headers: string[], columnName: string): string {
	const index = getColumnIndex(headers, columnName);
	return index >= 0 ? (row[index] || "").trim() : "";
}

// -----------------------------------------------------------------------------
// Legacy Items Import
// -----------------------------------------------------------------------------

function processLegacyItemRow(
	row: string[],
	headers: string[],
	rowNumber: number,
): { data: Record<string, unknown> | null; issues: string[] } {
	const issues: string[] = [];

	const ean = getColumnValue(row, headers, "Číslo");
	const name = getColumnValue(row, headers, "Název položky");
	const category = getColumnValue(row, headers, "Skupina") || null;
	const vatRateRaw = getColumnValue(row, headers, "DPH");
	const unitOfMeasure = getColumnValue(row, headers, "Jednotka") || "ks";

	const salePriceGroup1Raw = getColumnValue(row, headers, "Prodej 1");
	const salePriceGroup2Raw = getColumnValue(row, headers, "Prodej 2");
	const salePriceGroup3Raw = getColumnValue(row, headers, "Prodej 3");
	const salePriceGroup4Raw = getColumnValue(row, headers, "Prodej 4");

	// Validate required fields
	if (!ean) {
		issues.push("Missing required field: Číslo (ean)");
	}
	if (!name) {
		issues.push("Missing required field: Název položky (name)");
	}

	// Parse VAT rate
	const vatRate = parseVatRate(vatRateRaw);
	if (vatRate === null) {
		issues.push(`Invalid VAT rate: "${vatRateRaw}"`);
	}

	// Parse prices
	const salePriceGroup1 = parseDecimalToHellers(salePriceGroup1Raw);
	const salePriceGroup2 = parseDecimalToHellers(salePriceGroup2Raw);
	const salePriceGroup3 = parseDecimalToHellers(salePriceGroup3Raw);
	const salePriceGroup4 = parseDecimalToHellers(salePriceGroup4Raw);

	if (salePriceGroup1 === null) issues.push(`Invalid price Prodej 1: "${salePriceGroup1Raw}"`);
	if (salePriceGroup2 === null) issues.push(`Invalid price Prodej 2: "${salePriceGroup2Raw}"`);
	if (salePriceGroup3 === null) issues.push(`Invalid price Prodej 3: "${salePriceGroup3Raw}"`);
	if (salePriceGroup4 === null) issues.push(`Invalid price Prodej 4: "${salePriceGroup4Raw}"`);

	if (issues.length > 0) {
		return { data: null, issues };
	}

	return {
		data: {
			ean,
			name,
			category,
			vat_rate: vatRate,
			unit_of_measure: unitOfMeasure,
			sale_price_group1: salePriceGroup1,
			sale_price_group2: salePriceGroup2,
			sale_price_group3: salePriceGroup3,
			sale_price_group4: salePriceGroup4,
			note: null,
		},
		issues: [],
	};
}

async function importLegacyItems(filePath: string): Promise<ImportResult> {
	const db = getDatabase();
	const content = fs.readFileSync(filePath, "utf-8");
	const { headers, rows } = parseTSV(content);

	if (headers.length === 0) {
		return { success: false, error: "Empty file or invalid format" };
	}

	const errors: ImportError[] = [];
	let imported = 0;

	const insertStmt = db.prepare(`
		INSERT INTO items (
			ean, name, category, vat_rate, unit_of_measure,
			sale_price_group1, sale_price_group2, sale_price_group3, sale_price_group4,
			note
		) VALUES (
			@ean, @name, @category, @vat_rate, @unit_of_measure,
			@sale_price_group1, @sale_price_group2, @sale_price_group3, @sale_price_group4,
			@note
		)
	`);

	for (let i = 0; i < rows.length; i++) {
		const rowNumber = i + 2; // +2 because row 1 is header, and we're 1-indexed
		const row = rows[i];
		const rawRow = row.join("\t");

		const { data, issues } = processLegacyItemRow(row, headers, rowNumber);

		if (issues.length > 0 || data === null) {
			errors.push({ rowNumber, rawRow, issues });
			continue;
		}

		try {
			insertStmt.run(data);
			imported++;
		} catch (dbError: any) {
			const errorMessage = dbError.message || "Unknown database error";
			if (errorMessage.includes("UNIQUE constraint failed") || errorMessage.includes("PRIMARY KEY")) {
				errors.push({ rowNumber, rawRow, issues: [`Duplicate EAN: ${data.ean}`] });
			} else {
				errors.push({ rowNumber, rawRow, issues: [`Database error: ${errorMessage}`] });
			}
		}
	}

	// Write error log if there were errors
	let logFile: string | undefined;
	if (errors.length > 0) {
		const timestamp = Date.now();
		logFile = path.join(
			path.dirname(filePath),
			`import-items-errors-${timestamp}.log`,
		);
		writeErrorLog(logFile, errors);
	}

	return {
		success: true,
		imported,
		skipped: errors.length,
		logFile,
	};
}

// -----------------------------------------------------------------------------
// Legacy Contacts Import
// -----------------------------------------------------------------------------

function processLegacyContactRow(
	row: string[],
	headers: string[],
	rowNumber: number,
): { data: Record<string, unknown> | null; issues: string[] } {
	const issues: string[] = [];

	const ico = getColumnValue(row, headers, "IČ");
	const modifierRaw = getColumnValue(row, headers, "Modifikátor");
	const companyName = getColumnValue(row, headers, "Název firmy");
	const street = getColumnValue(row, headers, "Ulice") || null;
	const city = getColumnValue(row, headers, "Obec") || null;
	const postalCodeRaw = getColumnValue(row, headers, "PSČ");
	const dic = getColumnValue(row, headers, "DIČBZK-C1FE7") || null;
	const typeRaw = getColumnValue(row, headers, "Typ");
	const phone = getColumnValue(row, headers, "Telefon 1") || null;
	const priceGroupRaw = getColumnValue(row, headers, "Cen. skup.");
	const accountNumber = getColumnValue(row, headers, "Číslo účtu");
	const bankCode = getColumnValue(row, headers, "Kód banky");
	const email = getColumnValue(row, headers, "Mail") || null;

	// Validate required fields
	if (!ico) {
		issues.push("Missing required field: IČ (ico)");
	}
	if (!companyName) {
		issues.push("Missing required field: Název firmy (company_name)");
	}

	// Parse modifier
	const modifier = modifierRaw ? parseInt(modifierRaw, 10) : 1;
	if (isNaN(modifier)) {
		issues.push(`Invalid modifier: "${modifierRaw}"`);
	}

	// Parse type
	const contactType = parseContactType(typeRaw);
	if (contactType === null) {
		issues.push(`Invalid contact type: "${typeRaw}" (expected O, DO, ODO)`);
	}

	// Parse price group
	let priceGroup = 1;
	if (priceGroupRaw) {
		priceGroup = parseInt(priceGroupRaw, 10);
		if (isNaN(priceGroup) || priceGroup < 1 || priceGroup > 4) {
			issues.push(`Invalid price group: "${priceGroupRaw}" (expected 1-4)`);
			priceGroup = 1;
		}
	}

	// Process postal code
	const postalCode = postalCodeRaw ? stripPSCSpaces(postalCodeRaw) : null;

	// Combine bank account
	const bankAccount = combineBankAccount(accountNumber, bankCode);

	if (issues.length > 0) {
		return { data: null, issues };
	}

	return {
		data: {
			ico,
			modifier,
			company_name: companyName,
			street,
			city,
			postal_code: postalCode,
			dic,
			is_supplier: contactType!.is_supplier,
			is_customer: contactType!.is_customer,
			phone,
			price_group: priceGroup,
			bank_account: bankAccount,
			email,
			representative_name: null,
			website: null,
		},
		issues: [],
	};
}

async function importLegacyContacts(filePath: string): Promise<ImportResult> {
	const db = getDatabase();
	const content = fs.readFileSync(filePath, "utf-8");
	const { headers, rows } = parseTSV(content);

	if (headers.length === 0) {
		return { success: false, error: "Empty file or invalid format" };
	}

	const errors: ImportError[] = [];
	let imported = 0;

	const insertStmt = db.prepare(`
		INSERT INTO contacts (
			ico, modifier, company_name, street, city, postal_code, dic,
			is_supplier, is_customer, phone, price_group, bank_account, email,
			representative_name, website
		) VALUES (
			@ico, @modifier, @company_name, @street, @city, @postal_code, @dic,
			@is_supplier, @is_customer, @phone, @price_group, @bank_account, @email,
			@representative_name, @website
		)
	`);

	for (let i = 0; i < rows.length; i++) {
		const rowNumber = i + 2;
		const row = rows[i];
		const rawRow = row.join("\t");

		const { data, issues } = processLegacyContactRow(row, headers, rowNumber);

		if (issues.length > 0 || data === null) {
			errors.push({ rowNumber, rawRow, issues });
			continue;
		}

		try {
			insertStmt.run(data);
			imported++;
		} catch (dbError: any) {
			const errorMessage = dbError.message || "Unknown database error";
			if (errorMessage.includes("UNIQUE constraint failed") || errorMessage.includes("PRIMARY KEY")) {
				errors.push({ rowNumber, rawRow, issues: [`Duplicate contact: ICO ${data.ico}, modifier ${data.modifier}`] });
			} else {
				errors.push({ rowNumber, rawRow, issues: [`Database error: ${errorMessage}`] });
			}
		}
	}

	// Write error log if there were errors
	let logFile: string | undefined;
	if (errors.length > 0) {
		const timestamp = Date.now();
		logFile = path.join(
			path.dirname(filePath),
			`import-contacts-errors-${timestamp}.log`,
		);
		writeErrorLog(logFile, errors);
	}

	return {
		success: true,
		imported,
		skipped: errors.length,
		logFile,
	};
}

// -----------------------------------------------------------------------------
// IPC Handler Registration for Legacy Import
// -----------------------------------------------------------------------------

function registerLegacyImportHandlers() {
	ipcMain.handle("db:importLegacyItems", async (event) => {
		try {
			const window = BrowserWindow.fromWebContents(event.sender);

			const result = await dialog.showOpenDialog(window!, {
				title: "Vyberte soubor s položkami (TSV)",
				filters: [
					{ name: "TSV soubory", extensions: ["tsv", "txt"] },
					{ name: "Všechny soubory", extensions: ["*"] },
				],
				properties: ["openFile"],
			});

			if (result.canceled || result.filePaths.length === 0) {
				return { success: false, canceled: true };
			}

			const filePath = result.filePaths[0];
			logger.info(`Importing legacy items from: ${filePath}`);

			return await importLegacyItems(filePath);
		} catch (error: any) {
			logger.error("Legacy items import failed:", error);
			return {
				success: false,
				error: error.message || "Import selhal",
			};
		}
	});

	ipcMain.handle("db:importLegacyContacts", async (event) => {
		try {
			const window = BrowserWindow.fromWebContents(event.sender);

			const result = await dialog.showOpenDialog(window!, {
				title: "Vyberte soubor s kontakty (TSV)",
				filters: [
					{ name: "TSV soubory", extensions: ["tsv", "txt"] },
					{ name: "Všechny soubory", extensions: ["*"] },
				],
				properties: ["openFile"],
			});

			if (result.canceled || result.filePaths.length === 0) {
				return { success: false, canceled: true };
			}

			const filePath = result.filePaths[0];
			logger.info(`Importing legacy contacts from: ${filePath}`);

			return await importLegacyContacts(filePath);
		} catch (error: any) {
			logger.error("Legacy contacts import failed:", error);
			return {
				success: false,
				error: error.message || "Import selhal",
			};
		}
	});
}

export { registerDataTransferHandlers, registerLegacyImportHandlers };