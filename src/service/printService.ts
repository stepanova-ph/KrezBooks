import { Invoice, StockMovement } from "../types/database";
import { COMPANY_INFO } from "../config/companyInfo";
import { calculateItemTotals, getVatPercentage } from "../utils/invoiceCalculations";
import { renderInvoice } from "../templates/invoice/invoiceRenderer";

export interface InvoiceItemRow {
	name: string;
	amount: number;
	unit: string;
	priceWithoutVat: number;
	vatAmount: number;
	priceWithVat: number;
	totalWithVat: number;
	vatRate: number;
}

export interface InvoiceTotals {
	totalWithoutVat: number;
	totalVatAmount: number;
	subtotalBeforeDiscount: number; // Sum with VAT before discount (equals totalBeforeRounding when no discount)
	discount: number | null; // Percentage discount 1-100, null = no discount
	discountAmount: number; // With-VAT amount subtracted by the discount
	totalBeforeRounding: number; // Sum before smart rounding (after discount)
	rounding: number; // Rounding adjustment (-0.01, 0, or +0.01)
	totalWithVat: number; // After rounding
}

export interface VatRecapRow {
	vatRate: number;
	baseAmount: number;
	vatAmount: number;
	totalAmount: number;
}

export interface InvoicePrintData {
	invoice: Invoice;
	items: InvoiceItemRow[];
	totals: InvoiceTotals;
	vatRecap: VatRecapRow[];
	seller: typeof COMPANY_INFO;
	buyer: {
		companyName: string;
		ico?: string;
		dic?: string;
		street?: string;
		city?: string;
		postalCode?: string;
		phone?: string;
		email?: string;
		bankAccount?: string;
	};
	currency: {
		code: string;
		symbol: string;
	};
}

// Page dimensions in mm (A4 with 10mm padding)
const PAGE_HEIGHT_MM = 297 - 20; // A4 height minus top/bottom padding
const HEADER_HEIGHT_MM = 75; // Header height (parties + meta box)
const FOOTER_HEIGHT_MM = 30; // Footer height (notes + issued by)
const TABLE_HEADER_HEIGHT_MM = 8; // Table header row
const ROW_BASE_HEIGHT_MM = 6; // Single-line row height
const ROW_HEIGHT_PER_LINE_MM = 3.5; // Additional height per line in item name
const SUMMARY_HEIGHT_MM = 45; // VAT recap + totals section

// Estimate how many lines an item name will take (roughly 60 characters per line at 8pt)
function estimateNameLines(name: string): number {
	const CHARS_PER_LINE = 60;
	return Math.ceil(name.length / CHARS_PER_LINE);
}

/**
 * Calculate invoice items with VAT for sale invoices and returns
 * Note: Only sale invoices (types 3 & 4) and dobropis (type 6) should be printed
 * Reuses shared calculation logic with smart rounding
 */
function calculateInvoiceItems(
	stockMovements: StockMovement[],
	itemNames: Map<string, string>,
	itemUnits: Map<string, string>,
	invoiceType: number,
): InvoiceItemRow[] {
	return stockMovements.map((movement) => {
		const priceWithoutVat = Number(movement.price_per_unit);
		// Sale invoices store negative amounts but print positive;
		// dobropis (type 6) stores positive amounts but prints negative.
		// Calculate on absolute values so smart rounding mirrors the original
		// sale exactly, then apply the display sign.
		const absAmount = Math.abs(Number(movement.amount));
		const sign = invoiceType === 6 ? -1 : 1;
		const amount = sign * absAmount;

		// Use shared calculation logic with smart rounding
		const { vatAmount: absVatAmount, totalWithVat: absTotalWithVat } =
			calculateItemTotals(priceWithoutVat, absAmount, movement.vat_rate);
		const vatAmount = sign * absVatAmount;
		const totalWithVat = sign * absTotalWithVat;

		const vatPercentage = getVatPercentage(movement.vat_rate);
		const vatRateDecimal = vatPercentage / 100;
		const priceWithVat = priceWithoutVat * (1 + vatRateDecimal);

		return {
			name: itemNames.get(movement.item_ean) || movement.item_ean,
			amount,
			unit: itemUnits.get(movement.item_ean) || "ks",
			priceWithoutVat,
			vatAmount,
			priceWithVat,
			totalWithVat,
			vatRate: vatPercentage,
		};
	});
}

/**
 * Calculate invoice totals with smart rounding using group-by-VAT-rate method
 * Groups items by VAT rate, sums bases per group, then calculates VAT from grouped sums
 */
function calculateTotals(
	items: InvoiceItemRow[],
	isInEur: boolean = false,
	discount: number | null = null,
): InvoiceTotals {
	// Group items by VAT rate and sum base prices
	// Note: item.vatRate is the percentage value (0, 12, 21), not the index
	const groupedByVat: { [vatPercentage: number]: number } = {};

	items.forEach((item) => {
		const basePrice = item.priceWithoutVat * item.amount;
		if (!groupedByVat[item.vatRate]) {
			groupedByVat[item.vatRate] = 0;
		}
		groupedByVat[item.vatRate] += basePrice;
	});

	// Calculate VAT and totals from grouped sums
	let totalWithoutVat = 0;
	let totalVatAmount = 0;
	let totalWithVat = 0;

	Object.entries(groupedByVat).forEach(([vatPercentageStr, baseSum]) => {
		const vatPercentage = Number.parseFloat(vatPercentageStr);
		const vatAmount = baseSum * (vatPercentage / 100);

		totalWithoutVat += baseSum;
		totalVatAmount += vatAmount;
		totalWithVat += baseSum + vatAmount;
	});

	// Apply invoice-level discount; VAT is computed from the discounted bases
	const subtotalBeforeDiscount = totalWithVat;
	const discountFactor = discount ? 1 - discount / 100 : 1;
	totalWithoutVat *= discountFactor;
	totalVatAmount *= discountFactor;
	totalWithVat *= discountFactor;
	const discountAmount = subtotalBeforeDiscount - totalWithVat;

	// Save the sum BEFORE rounding
	const totalBeforeRounding = totalWithVat;

	// EUR: round to nearest 0.10, CZK: round to nearest whole crown
	// Round on the absolute value so negative totals (dobropis) mirror sales exactly
	const totalSign = totalWithVat < 0 ? -1 : 1;
	const roundedTotal =
		totalSign *
		(isInEur
			? Math.round(Math.abs(totalWithVat) * 10) / 10
			: Math.round(Math.abs(totalWithVat)));
	const rounding = roundedTotal - totalWithVat;
	totalWithVat = roundedTotal;

	// Old smart rounding (only adjusted .99 and .01):
	// const cents = Math.round((totalWithVat % 1) * 100);
	// let rounding = 0;
	// if (cents === 99) {
	// 	rounding = 0.01;
	// 	totalVatAmount += 0.01;
	// 	totalWithVat += 0.01;
	// } else if (cents === 1) {
	// 	rounding = -0.01;
	// 	totalVatAmount -= 0.01;
	// 	totalWithVat -= 0.01;
	// }

	return {
		totalWithoutVat,
		totalVatAmount,
		subtotalBeforeDiscount,
		discount: discount ?? null,
		discountAmount,
		totalBeforeRounding,
		rounding,
		totalWithVat,
	};
}

/**
 * Calculate VAT recapitulation grouped by VAT rate
 * The invoice-level discount reduces each rate's base (and therefore VAT)
 */
function calculateVatRecap(
	items: InvoiceItemRow[],
	discount: number | null = null,
): VatRecapRow[] {
	const recapMap = new Map<number, VatRecapRow>();

	items.forEach((item) => {
		const baseAmount = item.priceWithoutVat * item.amount;
		const existing = recapMap.get(item.vatRate);

		if (existing) {
			existing.baseAmount += baseAmount;
			existing.vatAmount += item.vatAmount;
			existing.totalAmount += item.totalWithVat;
		} else {
			recapMap.set(item.vatRate, {
				vatRate: item.vatRate,
				baseAmount: baseAmount,
				vatAmount: item.vatAmount,
				totalAmount: item.totalWithVat,
			});
		}
	});

	const discountFactor = discount ? 1 - discount / 100 : 1;

	// Sort by VAT rate ascending
	return Array.from(recapMap.values())
		.map((row) => ({
			vatRate: row.vatRate,
			baseAmount: row.baseAmount * discountFactor,
			vatAmount: row.vatAmount * discountFactor,
			totalAmount: row.totalAmount * discountFactor,
		}))
		.sort((a, b) => a.vatRate - b.vatRate);
}

/**
 * Prepare invoice data for printing
 * Only supports sale invoices (types 3 & 4) and dobropis (type 6)
 */
export function prepareInvoicePrintData(
	invoice: Invoice,
	stockMovements: StockMovement[],
	itemNames: Map<string, string>,
	itemUnits: Map<string, string>,
): InvoicePrintData {
	// Validate that this is a printable invoice type
	if (invoice.type !== 3 && invoice.type !== 4 && invoice.type !== 6) {
		throw new Error(
			"Tisk je podporován pouze pro prodejní faktury (Prodej hotovost a Prodej faktura) a dobropisy",
		);
	}

	const items = calculateInvoiceItems(
		stockMovements,
		itemNames,
		itemUnits,
		invoice.type,
	);
	// Discount applies to sale invoices only
	const discount =
		invoice.type === 3 || invoice.type === 4 ? (invoice.discount ?? null) : null;
	const totals = calculateTotals(items, !!invoice.is_in_eur, discount);
	const vatRecap = calculateVatRecap(items, discount);

	return {
		invoice,
		items,
		totals,
		vatRecap,
		seller: COMPANY_INFO,
		buyer: {
			companyName: invoice.company_name || "",
			ico: invoice.ico,
			dic: invoice.dic,
			street: invoice.street,
			city: invoice.city,
			postalCode: invoice.postal_code,
			phone: invoice.phone,
			email: invoice.email,
			bankAccount: invoice.bank_account,
		},
		currency: {
			code: invoice.is_in_eur ? "EUR" : "CZK",
			symbol: invoice.is_in_eur ? "€" : "Kč",
		},
	};
}

/**
 * Split items into pages based on actual row heights
 */
function paginateItems(items: InvoiceItemRow[]): InvoiceItemRow[][] {
	if (items.length === 0) return [[]];

	const pages: InvoiceItemRow[][] = [];
	let currentPage: InvoiceItemRow[] = [];
	let currentPageHeight = 0;

	// First page has header, subsequent pages don't
	let isFirstPage = true;

	for (const item of items) {
		// Calculate this row's height
		const nameLines = estimateNameLines(item.name);
		const rowHeight = ROW_BASE_HEIGHT_MM + (nameLines - 1) * ROW_HEIGHT_PER_LINE_MM;

		// Calculate available space on current page
		const pageContentHeight = isFirstPage
			? PAGE_HEIGHT_MM - HEADER_HEIGHT_MM - TABLE_HEADER_HEIGHT_MM - FOOTER_HEIGHT_MM - SUMMARY_HEIGHT_MM
			: PAGE_HEIGHT_MM - TABLE_HEADER_HEIGHT_MM - 15; // 15mm for page number

		// Check if item fits on current page
		if (currentPageHeight + rowHeight > pageContentHeight && currentPage.length > 0) {
			// Start new page
			pages.push(currentPage);
			currentPage = [item];
			currentPageHeight = rowHeight;
			isFirstPage = false;
		} else {
			// Add to current page
			currentPage.push(item);
			currentPageHeight += rowHeight;
		}
	}

	// Add last page
	if (currentPage.length > 0) {
		pages.push(currentPage);
	}

	return pages;
}

/**
 * Generate HTML for invoice using template system
 */
export function generateInvoiceHTML(data: InvoicePrintData): string {
	const pages = paginateItems(data.items);
	return renderInvoice(data, pages);
}