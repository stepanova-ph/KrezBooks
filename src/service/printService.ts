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
	totalBeforeRounding: number; // Sum before smart rounding
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
 * Calculate invoice items with VAT for sale invoices
 * Note: Only sale invoices (types 3 & 4) should be printed
 * Reuses shared calculation logic with smart rounding
 */
function calculateInvoiceItems(
	stockMovements: StockMovement[],
	itemNames: Map<string, string>,
): InvoiceItemRow[] {
	return stockMovements.map((movement) => {
		const priceWithoutVat = Number(movement.price_per_unit);
		// For sale invoices, amounts are stored as negative, display as positive
		const amount = Math.abs(Number(movement.amount));

		// Use shared calculation logic with smart rounding
		const { vatAmount, totalWithVat } = calculateItemTotals(
			priceWithoutVat,
			amount,
			movement.vat_rate,
		);

		const vatPercentage = getVatPercentage(movement.vat_rate);
		const vatRateDecimal = vatPercentage / 100;
		const priceWithVat = priceWithoutVat * (1 + vatRateDecimal);

		return {
			name: itemNames.get(movement.item_ean) || movement.item_ean,
			amount,
			unit: movement.unit || "ks",
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
function calculateTotals(items: InvoiceItemRow[]): InvoiceTotals {
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

	// Save the sum BEFORE rounding
	const totalBeforeRounding = totalWithVat;

	// Smart rounding: transfer 1 cent between VAT and total when total is .99 or .01
	const cents = Math.round((totalWithVat % 1) * 100);
	let rounding = 0;

	if (cents === 99) {
		rounding = 0.01;
		totalVatAmount += 0.01;
		totalWithVat += 0.01;
	} else if (cents === 1) {
		rounding = -0.01;
		totalVatAmount -= 0.01;
		totalWithVat -= 0.01;
	}

	return {
		totalWithoutVat,
		totalVatAmount,
		totalBeforeRounding,
		rounding,
		totalWithVat,
	};
}

/**
 * Calculate VAT recapitulation grouped by VAT rate
 */
function calculateVatRecap(items: InvoiceItemRow[]): VatRecapRow[] {
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

	// Sort by VAT rate ascending
	return Array.from(recapMap.values()).sort((a, b) => a.vatRate - b.vatRate);
}

/**
 * Prepare invoice data for printing
 * Only supports sale invoices (types 3 & 4)
 */
export function prepareInvoicePrintData(
	invoice: Invoice,
	stockMovements: StockMovement[],
	itemNames: Map<string, string>,
): InvoicePrintData {
	// Validate that this is a sale invoice
	if (invoice.type !== 3 && invoice.type !== 4) {
		throw new Error(
			"Tisk je podporován pouze pro prodejní faktury (Prodej hotovost a Prodej faktura)",
		);
	}

	const items = calculateInvoiceItems(stockMovements, itemNames);
	const totals = calculateTotals(items);
	const vatRecap = calculateVatRecap(items);

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