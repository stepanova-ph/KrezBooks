import { ipcMain } from "electron";
import { getDatabase } from "../database";
import { logger } from "../logger";
import { invoiceQueries } from "../queries";
import { stockMovementQueries } from "../queries/stockMovements";
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

/**
 * Read a file with encoding detection.
 * Tries UTF-8 first; if the result contains replacement characters (garbled text),
 * falls back to Windows-1250 (common Czech encoding).
 */
async function readFileWithEncoding(filePath: string): Promise<string> {
	const buffer = await fs.promises.readFile(filePath);

	// Check if the buffer is valid UTF-8 by looking for typical Windows-1250 byte patterns
	// Windows-1250 Czech chars (á=e1, č=e8, ď=ef, é=e9, ě=ec, í=ed, etc.) fall in 0x80-0xFF
	// and are NOT valid single-byte UTF-8. If we see high bytes that don't form valid UTF-8
	// multibyte sequences, it's likely Windows-1250.
	let hasInvalidUtf8 = false;
	for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
		const byte = buffer[i];
		if (byte >= 0x80 && byte <= 0xBF) {
			// Continuation byte without a leading byte — not valid UTF-8 start
			if (i === 0 || buffer[i - 1] < 0xC0) {
				hasInvalidUtf8 = true;
				break;
			}
		} else if (byte >= 0xC0 && byte <= 0xDF) {
			// 2-byte UTF-8 sequence — next byte must be 0x80-0xBF
			if (i + 1 >= buffer.length || buffer[i + 1] < 0x80 || buffer[i + 1] > 0xBF) {
				hasInvalidUtf8 = true;
				break;
			}
			i++; // skip continuation byte
		} else if (byte >= 0x80) {
			// Bytes like 0xE1, 0x9E, 0xED in isolation are Windows-1250
			// Check if this could be a valid 3/4-byte UTF-8 sequence
			if (byte >= 0xE0 && byte <= 0xEF) {
				if (i + 2 >= buffer.length || buffer[i + 1] < 0x80 || buffer[i + 1] > 0xBF || buffer[i + 2] < 0x80 || buffer[i + 2] > 0xBF) {
					hasInvalidUtf8 = true;
					break;
				}
				i += 2;
			} else {
				hasInvalidUtf8 = true;
				break;
			}
		}
	}

	if (hasInvalidUtf8) {
		logger.info("Detected Windows-1250 encoding, converting to UTF-8");
		const decoder = new TextDecoder("windows-1250");
		return decoder.decode(buffer);
	}

	return buffer.toString("utf-8");
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

function parseDecimalPrice(value: string): number | null {
	if (!value || value.trim() === "") return 0;

	const normalized = value.replace(",", ".").replace(/\s/g, "");
	const parsed = parseFloat(normalized);

	if (isNaN(parsed)) return null;

	return parsed;
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

/**
 * Extracts and normalizes category from item name.
 * Input: "Ch-klapka 75 bez přít." or "F-teflon.páska"
 * Output: { category: "CH", name: "Klapka 75 bez přít." }
 *
 * Category normalization:
 * - Extracts prefix before first "-"
 * - Removes non-alphanumeric characters
 * - Converts to uppercase
 *
 * Name normalization:
 * - Removes the category prefix and "-"
 * - Capitalizes first letter
 */
function extractCategoryFromName(rawName: string): { category: string | null; name: string } {
	const trimmedName = rawName.trim();

	const dashIndex = trimmedName.indexOf("-");
	if (dashIndex === -1 || dashIndex === 0) {
		// No dash or starts with dash - no category to extract
		return { category: null, name: trimmedName };
	}

	const rawCategory = trimmedName.substring(0, dashIndex);
	const nameAfterDash = trimmedName.substring(dashIndex + 1);

	// Normalize category: remove non-alphanumeric, uppercase
	const normalizedCategory = rawCategory
		.replace(/[^a-zA-Z0-9]/g, "")
		.toUpperCase();

	// If category is empty after normalization, treat as no category
	if (!normalizedCategory) {
		return { category: null, name: trimmedName };
	}

	// Normalize name: trim and capitalize first letter
	const trimmedNameAfterDash = nameAfterDash.trim();
	const capitalizedName = trimmedNameAfterDash.length > 0
		? trimmedNameAfterDash.charAt(0).toUpperCase() + trimmedNameAfterDash.slice(1)
		: trimmedNameAfterDash;

	return { category: normalizedCategory, name: capitalizedName };
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

function vatRateToPercentage(vatRate: number): number {
	if (vatRate === 1) return 12;
	if (vatRate === 2) return 21;
	return 0;
}

interface LegacyItemResult {
	data: Record<string, unknown> | null;
	stockData: { ean: string; amount: number; buyPrice: number; vatRate: number } | null;
	issues: string[];
}

function processLegacyItemRow(
	row: string[],
	headers: string[],
	pricesIncludeVat: boolean,
): LegacyItemResult {
	const issues: string[] = [];

	// Support both formats: use Čarový kód as EAN if available, fall back to Číslo
	const barcode = getColumnValue(row, headers, "Čarový kód");
	const itemNumber = getColumnValue(row, headers, "Číslo");
	const ean = barcode || itemNumber;
	const rawName = getColumnValue(row, headers, "Název položky");

	// Extract category from name prefix (e.g., "Ch-klapka" -> category: "CH", name: "Klapka")
	const { category, name } = extractCategoryFromName(rawName);
	const vatRateRaw = getColumnValue(row, headers, "DPH");
	const unitOfMeasure = getColumnValue(row, headers, "Jednotka") || "ks";

	const salePriceGroup1Raw = getColumnValue(row, headers, "Prodej 1");
	const salePriceGroup2Raw = getColumnValue(row, headers, "Prodej 2");
	const salePriceGroup3Raw = getColumnValue(row, headers, "Prodej 3");
	const salePriceGroup4Raw = getColumnValue(row, headers, "Prodej 4");

	const stockAmountRaw = getColumnValue(row, headers, "Množství");
	const buyPriceRaw = getColumnValue(row, headers, "Nákup");

	if (!ean) {
		issues.push("Missing required field: Číslo (ean)");
	}
	if (!name) {
		issues.push("Missing required field: Název položky (name)");
	}

	// Default to 21% (standard rate) if DPH column is missing
	const vatRate = vatRateRaw ? parseVatRate(vatRateRaw) : 2;
	if (vatRate === null) {
		issues.push(`Invalid VAT rate: "${vatRateRaw}"`);
	}

	const salePriceGroup1 = parseDecimalPrice(salePriceGroup1Raw);
	// If Prodej 2/3/4 columns are missing, fall back to Prodej 1
	const salePriceGroup2 = parseDecimalPrice(salePriceGroup2Raw) || salePriceGroup1;
	const salePriceGroup3 = parseDecimalPrice(salePriceGroup3Raw) || salePriceGroup1;
	const salePriceGroup4 = parseDecimalPrice(salePriceGroup4Raw) || salePriceGroup1;

	if (salePriceGroup1 === null)
		issues.push(`Invalid price Prodej 1: "${salePriceGroup1Raw}"`);

	if (issues.length > 0) {
		return { data: null, stockData: null, issues };
	}

	// Parse stock amount and buy price for correction invoice
	const stockAmount = parseDecimalPrice(stockAmountRaw) ?? 0;
	const buyPrice = parseDecimalPrice(buyPriceRaw) ?? 0;

	let p1 = salePriceGroup1!;
	let p2 = salePriceGroup2!;
	let p3 = salePriceGroup3!;
	let p4 = salePriceGroup4!;

	if (pricesIncludeVat) {
		const divisor = 1 + vatRateToPercentage(vatRate!) / 100;
		p1 = p1 / divisor;
		p2 = p2 / divisor;
		p3 = p3 / divisor;
		p4 = p4 / divisor;
	}

	return {
		data: {
			ean,
			name,
			category,
			vat_rate: vatRate,
			unit_of_measure: unitOfMeasure,
			sale_price_group1: p1,
			sale_price_group2: p2,
			sale_price_group3: p3,
			sale_price_group4: p4,
			note: null,
		},
		stockData: stockAmount !== 0 ? { ean, amount: stockAmount, buyPrice, vatRate: vatRate! } : null,
		issues: [],
	};
}

async function importLegacyItems(filePath: string, pricesIncludeVat: boolean): Promise<ImportResult> {
	const db = getDatabase();
	const content = await readFileWithEncoding(filePath);
	const { headers, rows } = parseTSV(content);

	await yieldToEventLoop();

	if (headers.length === 0) {
		return { success: false, error: "Empty file or invalid format" };
	}

	const errors: ImportError[] = [];
	let imported = 0;
	const stockEntries: { ean: string; amount: number; buyPrice: number; vatRate: number }[] = [];

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

		const { data, stockData, issues } = processLegacyItemRow(row, headers, pricesIncludeVat);

		if (issues.length > 0 || data === null) {
			errors.push({ rowNumber, rawRow, issues });
			continue;
		}

		try {
			insertStmt.run(data);
			imported++;
			if (stockData) {
				stockEntries.push(stockData);
			}
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

	// Create a single correction invoice (type 5) with stock movements for initial inventory
	let stockMovementsCreated = 0;
	if (stockEntries.length > 0) {
		try {
			const today = new Date().toISOString().split("T")[0];
			const correctionPrefix = "IMP";
			const correctionNumber = `${Date.now()}`;

			const insertInvoiceStmt = db.prepare(invoiceQueries.create);
			insertInvoiceStmt.run({
				number: correctionNumber,
				prefix: correctionPrefix,
				type: 5,
				payment_method: null,
				date_issue: today,
				date_tax: null,
				date_due: null,
				variable_symbol: null,
				order_number: null,
				note: "Počáteční stav skladu z legacy importu",
				ico: null,
				modifier: null,
				dic: null,
				company_name: null,
				bank_account: null,
				street: null,
				city: null,
				postal_code: null,
				phone: null,
				email: null,
				is_in_eur: 0,
			});

			const insertMovementStmt = db.prepare(stockMovementQueries.create);
			for (const entry of stockEntries) {
				try {
					insertMovementStmt.run({
						invoice_prefix: correctionPrefix,
						invoice_number: correctionNumber,
						item_ean: entry.ean,
						amount: entry.amount.toString(),
						price_per_unit: entry.buyPrice.toString(),
						vat_rate: entry.vatRate,
						reset_point: 0,
					});
					stockMovementsCreated++;
				} catch (smError: any) {
					errors.push({
						rowNumber: 0,
						rawRow: `Stock movement for EAN ${entry.ean}`,
						issues: [`Stock movement error: ${smError.message}`],
					});
				}
			}

			logger.info(`Created correction invoice ${correctionPrefix}${correctionNumber} with ${stockMovementsCreated} stock movements`);
		} catch (invoiceError: any) {
			logger.error("Failed to create correction invoice:", invoiceError);
			errors.push({
				rowNumber: 0,
				rawRow: "Correction invoice creation",
				issues: [`Failed to create correction invoice: ${invoiceError.message}`],
			});
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
	const dic = getColumnValue(row, headers, "DIČ") || null;
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
	const content = await readFileWithEncoding(filePath);
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
	pricesIncludeVat: boolean,
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

		const result = await importLegacyItems(itemsFile, pricesIncludeVat);
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
		async (event, directoryPath: string, pricesIncludeVat: boolean) => {
			try {
				if (!directoryPath) {
					return { success: false, error: "Nebyla vybrána složka" };
				}

				if (!fs.existsSync(directoryPath)) {
					return { success: false, error: "Vybraná složka neexistuje" };
				}

				logger.info(`Importing legacy data from: ${directoryPath}, pricesIncludeVat: ${pricesIncludeVat}`);

				const progressCallback = (message: string, progress: number) => {
					event.sender.send("import:progress", { message, progress });
				};

				importLegacyData(directoryPath, pricesIncludeVat, progressCallback)
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
