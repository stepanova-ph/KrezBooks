import { ipcMain } from "electron";
import { getDatabase } from "../database";
import { logger } from "../logger";
import fs from "fs";
import path from "path";

// =============================================================================
// SHARED TYPES AND UTILITIES
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

// =============================================================================
// HELPER: Async yield to event loop
// =============================================================================

/**
 * Yields control back to the event loop to prevent blocking.
 * Call this periodically in long-running operations.
 */
function yieldToEventLoop(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve));
}

function parseTSV(content: string): { headers: string[]; rows: string[][] } {
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

	const normalized = value.replace(",", ".").replace(/\s/g, "");
	const parsed = parseFloat(normalized);

	if (isNaN(parsed)) return null;

	return Math.round(parsed * 100);
}

function parseVatRate(value: string): number | null {
	const trimmed = value.trim();
	if (trimmed === "21 %" || trimmed === "21%") return 2;
	if (trimmed === "12 %" || trimmed === "12%") return 1;
	if (trimmed === "0 %" || trimmed === "0%") return 0;
	return null;
}

function parseContactType(
	value: string,
): { is_supplier: number; is_customer: number } | null {
	const trimmed = value.trim().toUpperCase();
	if (trimmed === "O") return { is_supplier: 0, is_customer: 1 };
	if (trimmed === "DO") return { is_supplier: 1, is_customer: 0 };
	if (trimmed === "ODO" || trimmed === "DOO")
		return { is_supplier: 1, is_customer: 1 };
	return null;
}

function stripPSCSpaces(value: string): string {
	return value.replace(/\s/g, "");
}

function combineBankAccount(
	accountNumber: string,
	bankCode: string,
): string | null {
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

function getColumnValue(
	row: string[],
	headers: string[],
	columnName: string,
): string {
	const index = getColumnIndex(headers, columnName);
	return index >= 0 ? (row[index] || "").trim() : "";
}

// =============================================================================
// LEGACY ITEMS IMPORT
// =============================================================================

function processLegacyItemRow(
	row: string[],
	headers: string[],
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

	if (!ean) {
		issues.push("Missing required field: Číslo (ean)");
	}
	if (!name) {
		issues.push("Missing required field: Název položky (name)");
	}

	const vatRate = parseVatRate(vatRateRaw);
	if (vatRate === null) {
		issues.push(`Invalid VAT rate: "${vatRateRaw}"`);
	}

	const salePriceGroup1 = parseDecimalToHellers(salePriceGroup1Raw);
	const salePriceGroup2 = parseDecimalToHellers(salePriceGroup2Raw);
	const salePriceGroup3 = parseDecimalToHellers(salePriceGroup3Raw);
	const salePriceGroup4 = parseDecimalToHellers(salePriceGroup4Raw);

	if (salePriceGroup1 === null)
		issues.push(`Invalid price Prodej 1: "${salePriceGroup1Raw}"`);
	if (salePriceGroup2 === null)
		issues.push(`Invalid price Prodej 2: "${salePriceGroup2Raw}"`);
	if (salePriceGroup3 === null)
		issues.push(`Invalid price Prodej 3: "${salePriceGroup3Raw}"`);
	if (salePriceGroup4 === null)
		issues.push(`Invalid price Prodej 4: "${salePriceGroup4Raw}"`);

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
	const content = await fs.promises.readFile(filePath, "utf-8");
	const { headers, rows } = parseTSV(content);

	await yieldToEventLoop();

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

		const { data, issues } = processLegacyItemRow(row, headers);

		if (issues.length > 0 || data === null) {
			errors.push({ rowNumber, rawRow, issues });
			continue;
		}

		try {
			insertStmt.run(data);
			imported++;
		} catch (dbError: any) {
			const errorMessage = dbError.message || "Unknown database error";
			if (
				errorMessage.includes("UNIQUE constraint failed") ||
				errorMessage.includes("PRIMARY KEY")
			) {
				errors.push({
					rowNumber,
					rawRow,
					issues: [`Duplicate EAN: ${data.ean}`],
				});
			} else {
				errors.push({
					rowNumber,
					rawRow,
					issues: [`Database error: ${errorMessage}`],
				});
			}
		}

		if (i % 10 === 0 && i > 0) {
			await yieldToEventLoop();
		}
	}

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

// =============================================================================
// LEGACY CONTACTS IMPORT
// =============================================================================

function processLegacyContactRow(
	row: string[],
	headers: string[],
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

	if (!ico) {
		issues.push("Missing required field: IČ (ico)");
	}
	if (!companyName) {
		issues.push("Missing required field: Název firmy (company_name)");
	}

	const modifier = modifierRaw ? parseInt(modifierRaw, 10) : 1;
	if (isNaN(modifier)) {
		issues.push(`Invalid modifier: "${modifierRaw}"`);
	}

	const contactType = parseContactType(typeRaw);
	if (contactType === null) {
		issues.push(`Invalid contact type: "${typeRaw}" (expected O, DO, ODO)`);
	}

	let priceGroup = 1;
	if (priceGroupRaw) {
		priceGroup = parseInt(priceGroupRaw, 10);
		if (isNaN(priceGroup) || priceGroup < 1 || priceGroup > 4) {
			issues.push(`Invalid price group: "${priceGroupRaw}" (expected 1-4)`);
			priceGroup = 1;
		}
	}

	const postalCode = postalCodeRaw ? stripPSCSpaces(postalCodeRaw) : null;

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
	const content = await fs.promises.readFile(filePath, "utf-8");
	const { headers, rows } = parseTSV(content);

	await yieldToEventLoop();

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

		const { data, issues } = processLegacyContactRow(row, headers);

		if (issues.length > 0 || data === null) {
			errors.push({ rowNumber, rawRow, issues });
			continue;
		}

		try {
			insertStmt.run(data);
			imported++;
		} catch (dbError: any) {
			const errorMessage = dbError.message || "Unknown database error";
			if (
				errorMessage.includes("UNIQUE constraint failed") ||
				errorMessage.includes("PRIMARY KEY")
			) {
				errors.push({
					rowNumber,
					rawRow,
					issues: [
						`Duplicate contact: ICO ${data.ico}, modifier ${data.modifier}`,
					],
				});
			} else {
				errors.push({
					rowNumber,
					rawRow,
					issues: [`Database error: ${errorMessage}`],
				});
			}
		}

		if (i % 10 === 0 && i > 0) {
			await yieldToEventLoop();
		}
	}

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

// =============================================================================
// UNIFIED LEGACY IMPORT
// =============================================================================

interface LegacyImportResult {
	success: boolean;
	canceled?: boolean;
	imported?: {
		contacts: number;
		items: number;
	};
	skipped?: {
		contacts: number;
		items: number;
	};
	logFiles?: string[];
	error?: string;
}

async function importLegacyData(
	directoryPath: string,
	progressCallback?: (message: string, progress: number) => void,
): Promise<LegacyImportResult> {
	const itemsFile = path.join(directoryPath, "items.tsv");
	const contactsFile = path.join(directoryPath, "contacts.tsv");

	const hasItems = fs.existsSync(itemsFile);
	const hasContacts = fs.existsSync(contactsFile);

	if (!hasItems && !hasContacts) {
		return {
			success: false,
			error:
				"Složka neobsahuje žádné TSV soubory k importu (items.tsv, contacts.tsv)",
		};
	}

	const imported = { contacts: 0, items: 0 };
	const skipped = { contacts: 0, items: 0 };
	const logFiles: string[] = [];

	const totalSteps = [hasContacts, hasItems].filter(Boolean).length;
	let currentStep = 0;

	if (hasContacts) {
		currentStep++;
		const progress = Math.round((currentStep / totalSteps) * 100);
		progressCallback?.(`Importuji kontakty (legacy)...`, progress);
		logger.info(`Importing legacy contacts from: ${contactsFile}`);

		const result = await importLegacyContacts(contactsFile);
		if (!result.success) {
			return {
				success: false,
				error: result.error || "Import kontaktů selhal",
			};
		}
		imported.contacts = result.imported || 0;
		skipped.contacts = result.skipped || 0;
		if (result.logFile) {
			logFiles.push(result.logFile);
		}
	}

	if (hasItems) {
		currentStep++;
		const progress = Math.round((currentStep / totalSteps) * 100);
		progressCallback?.(`Importuji položky (legacy)...`, progress);
		logger.info(`Importing legacy items from: ${itemsFile}`);

		const result = await importLegacyItems(itemsFile);
		if (!result.success) {
			return {
				success: false,
				error: result.error || "Import položek selhal",
			};
		}
		imported.items = result.imported || 0;
		skipped.items = result.skipped || 0;
		if (result.logFile) {
			logFiles.push(result.logFile);
		}
	}

	progressCallback?.(`Import dokončen`, 100);

	return {
		success: true,
		imported,
		skipped,
		logFiles: logFiles.length > 0 ? logFiles : undefined,
	};
}

// =============================================================================
// IPC HANDLER REGISTRATION
// =============================================================================

function registerLegacyImportHandlers() {
	ipcMain.handle(
		"db:importLegacyData",
		async (event, directoryPath: string) => {
			try {
				if (!directoryPath) {
					return { success: false, error: "Nebyla vybrána složka" };
				}

				if (!fs.existsSync(directoryPath)) {
					return { success: false, error: "Vybraná složka neexistuje" };
				}

				logger.info(`Importing legacy data from: ${directoryPath}`);

				const progressCallback = (message: string, progress: number) => {
					event.sender.send("import:progress", { message, progress });
				};

				importLegacyData(directoryPath, progressCallback)
					.then((result) => {
						event.sender.send("import:complete", result);
					})
					.catch((error) => {
						event.sender.send("import:complete", {
							success: false,
							error: error.message || "Import selhal",
						});
					});

				return { success: true, started: true };
			} catch (error: any) {
				logger.error("Legacy import failed:", error);
				event.sender.send("import:progress", {
					message: `Import selhal: ${error.message}`,
					progress: 0,
				});
				return {
					success: false,
					error: error.message || "Import selhal",
				};
			}
		},
	);
}

export { registerLegacyImportHandlers };
