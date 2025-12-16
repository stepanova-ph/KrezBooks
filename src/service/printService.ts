import { Invoice, StockMovement } from "../types/database";
import { VAT_RATES } from "../config/constants";
import { COMPANY_INFO } from "../config/companyInfo";
import { calculateItemTotals } from "../utils/invoiceCalculations";

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
	totalWithVat: number;
}

export interface InvoicePrintData {
	invoice: Invoice;
	items: InvoiceItemRow[];
	totals: InvoiceTotals;
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

const ITEMS_PER_PAGE = 25; // Adjust based on A4 fit

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

		const vatRateDecimal = VAT_RATES[movement.vat_rate].percentage / 100;
		const priceWithVat = priceWithoutVat * (1 + vatRateDecimal);

		return {
			name: itemNames.get(movement.item_ean) || movement.item_ean,
			amount,
			unit: movement.unit || "ks",
			priceWithoutVat,
			vatAmount,
			priceWithVat,
			totalWithVat,
			vatRate: VAT_RATES[movement.vat_rate].percentage,
		};
	});
}

/**
 * Calculate invoice totals
 */
function calculateTotals(items: InvoiceItemRow[]): InvoiceTotals {
	const totalWithoutVat = items.reduce(
		(sum, item) => sum + item.priceWithoutVat * item.amount,
		0,
	);
	const totalVatAmount = items.reduce((sum, item) => sum + item.vatAmount, 0);
	const totalWithVat = items.reduce((sum, item) => sum + item.totalWithVat, 0);

	return {
		totalWithoutVat,
		totalVatAmount,
		totalWithVat,
	};
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

	return {
		invoice,
		items,
		totals,
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
 * Format Czech date
 */
function formatDate(dateString?: string): string {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("cs-CZ");
}

/**
 * Format Czech currency
 */
function formatCurrency(amount: number): string {
	return amount.toLocaleString("cs-CZ", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}) + " Kč";
}

/**
 * Split items into pages
 */
function paginateItems(items: InvoiceItemRow[]): InvoiceItemRow[][] {
	const pages: InvoiceItemRow[][] = [];
	for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
		pages.push(items.slice(i, i + ITEMS_PER_PAGE));
	}
	return pages;
}

/**
 * Generate HTML for invoice
 */
export function generateInvoiceHTML(data: InvoicePrintData): string {
	const pages = paginateItems(data.items);
	const totalPages = pages.length;

	const pagesHTML = pages
		.map((pageItems, pageIndex) => {
			const isLastPage = pageIndex === totalPages - 1;
			const pageNumber = pageIndex + 1;

			return `
    <div class="page">
      ${generatePageHeader(data, pageNumber, totalPages)}
      ${generateItemsTable(pageItems, isLastPage ? data.totals : null)}
      </div>
      `;
    //   ${generatePageFooter()}
		})
		.join("");

	return `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Faktura ${data.invoice.prefix}${data.invoice.number}</title>
  <style>${getStyles()}</style>
</head>
<body>
  ${pagesHTML}
</body>
</html>
  `;
}

/**
 * Generate page header
 */
function generatePageHeader(
	data: InvoicePrintData,
	pageNumber: number,
	totalPages: number,
): string {
	const { invoice, seller, buyer } = data;

	return `
    <div class="header">
      <div class="header-row">
        
        <div class="invoice-title">
          <h1>FAKTURA</h1>
          <p class="invoice-number">${invoice.prefix}${invoice.number}</p>
          ${totalPages > 1 ? `<p class="page-number">Strana ${pageNumber} / ${totalPages}</p>` : ""}
        </div>
      </div>

      <div class="invoice-details-section detail-section">
        <h3>Údaje faktury</h3>
        <p><strong>Číslo faktury:</strong> ${invoice.prefix}${invoice.number}</p>
        ${invoice.variable_symbol ? `<p><strong>Variabilní symbol:</strong> ${invoice.variable_symbol}</p>` : ""}
        <p><strong>Datum vystavení:</strong> ${formatDate(invoice.date_issue)}</p>
        ${invoice.date_tax ? `<p><strong>Datum zdanitelného plnění:</strong> ${formatDate(invoice.date_tax)}</p>` : ""}
        ${invoice.date_due ? `<p><strong>Datum splatnosti:</strong> ${formatDate(invoice.date_due)}</p>` : ""}
        ${invoice.payment_method !== undefined ? `<p><strong>Způsob úhrady:</strong> ${invoice.payment_method === 0 ? "Hotovost" : "Bankovní převod"}</p>` : ""}
      </div>

      <div class="parties-grid">
        <div class="detail-section">
          <h3>Dodavatel</h3>
          <p><strong>${seller.companyName}</strong></p>
          <p>IČO: ${seller.ico}</p>
          ${seller.dic ? `<p>DIČ: ${seller.dic}</p>` : ""}
          <p>${seller.street}</p>
          <p>${seller.city}, ${seller.postalCode}</p>
          <p>Tel: ${seller.phone}</p>
          <p>Email: ${seller.email}</p>
          <p>Účet: ${seller.bankAccount}</p>
        </div>

        <div class="detail-section">
          <h3>Odběratel</h3>
          <p><strong>${buyer.companyName}</strong></p>
          ${buyer.ico ? `<p>IČO: ${buyer.ico}</p>` : ""}
          ${buyer.dic ? `<p>DIČ: ${buyer.dic}</p>` : ""}
          ${buyer.street ? `<p>${buyer.street}</p>` : ""}
          ${buyer.city && buyer.postalCode ? `<p>${buyer.city}, ${buyer.postalCode}</p>` : ""}
          ${buyer.phone ? `<p>Tel: ${buyer.phone}</p>` : ""}
          ${buyer.email ? `<p>Email: ${buyer.email}</p>` : ""}
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate items table
 */
function generateItemsTable(
	items: InvoiceItemRow[],
	totals: InvoiceTotals | null,
): string {
	const itemsRows = items
		.map(
			(item) => `
    <tr>
      <td class="item-name">${item.name}</td>
      <td class="number">${item.amount} ${item.unit}</td>
      <td class="number">${formatCurrency(item.priceWithoutVat)}</td>
      <td class="number">${formatCurrency(item.priceWithoutVat * item.amount)}</td>
      <td class="number">${item.vatRate}%</td>
      <td class="number">${formatCurrency(item.vatAmount)}</td>
      <td class="number"><strong>${formatCurrency(item.totalWithVat)}</strong></td>
    </tr>
  `,
		)
		.join("");

	const totalsRow = totals
		? `
    <tr class="subtotal-row">
      <td colspan="6"><strong>Součet položek:</strong></td>
      <td class="number"><strong>${formatCurrency(totals.totalWithVat)}</strong></td>
    </tr>
    <tr class="rounding-row">
      <td colspan="6"><strong>Zaokrouhlení:</strong></td>
      <td class="number"><strong>${formatCurrency(0)}</strong></td>
    </tr>
    <tr class="total-row">
      <td colspan="6"><strong>CELKEM K ÚHRADĚ:</strong></td>
      <td class="number"><strong>${formatCurrency(totals.totalWithVat)}</strong></td>
    </tr>
  `
		: "";

	return `
    <table class="items-table">
      <thead>
        <tr>
          <th>Název</th>
          <th class="number">Množství</th>
          <th class="number">Jednotková cena</th>
          <th class="number">Cena</th>
          <th class="number">Sazba DPH</th>
          <th class="number">DPH</th>
          <th class="number">Celkem</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        ${totalsRow}
      </tbody>
    </table>
  `;
}

/**
 * Generate page footer
 */
function generatePageFooter(): string {
	return `
    <div class="footer">
      <p>Děkujeme za vaši důvěru</p>
    </div>
  `;
}

/**
 * CSS styles
 */
function getStyles(): string {
	return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', sans-serif;
      font-size: 8pt;
      line-height: 1.3;
      color: #000;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 12mm;
      margin: 0 auto;
      background: white;
      page-break-after: always;
    }

    .page:last-child {
      page-break-after: auto;
    }

    @media print {
      .page {
        margin: 0;
        page-break-after: always;
      }
      .page:last-child {
        page-break-after: auto;
      }
    }

    .header {
      margin-bottom: 15px;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #333;
    }

    .company-info h1 {
      font-size: 12pt;
      margin-bottom: 3px;
    }

    .company-info p {
      font-size: 8pt;
      margin: 1px 0;
    }

    .invoice-title {
      text-align: right;
    }

    .invoice-title h1 {
      font-size: 18pt;
      margin-bottom: 3px;
    }

    .invoice-number {
      font-size: 11pt;
      font-weight: bold;
    }

    .page-number {
      font-size: 8pt;
      color: #666;
      margin-top: 3px;
    }

    .invoice-details-section {
      margin-bottom: 10px;
    }

    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }

    .detail-section {
      border: 1px solid #ddd;
      padding: 6px;
      background: #f9f9f9;
    }

    .detail-section h3 {
      font-size: 9pt;
      margin-bottom: 4px;
      padding-bottom: 3px;
      border-bottom: 1px solid #ccc;
    }

    .detail-section p {
      font-size: 7pt;
      margin: 2px 0;
      line-height: 1.2;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 8pt;
    }

    .items-table th {
      background: #333;
      color: white;
      padding: 4px 6px;
      text-align: left;
      font-weight: bold;
      font-size: 7pt;
      border: 1px solid #333;
      white-space: nowrap;
    }

    .items-table th.number {
      text-align: right;
    }

    .items-table th.col-name {
      width: 40%;
    }

    .items-table th.col-qty {
      width: 8%;
    }

    .items-table th.col-price {
      width: 10%;
    }

    .items-table th.col-total {
      width: 10%;
    }

    .items-table th.col-vat-rate {
      width: 8%;
    }

    .items-table th.col-vat {
      width: 10%;
    }

    .items-table th.col-final {
      width: 14%;
    }

    .items-table td {
      padding: 3px 6px;
      border: 1px solid #ddd;
      font-size: 7pt;
    }

    .items-table td.number {
      text-align: right;
      white-space: nowrap;
    }

    .items-table td.item-name {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .items-table tbody tr:nth-child(even) {
      background: #f9f9f9;
    }

    .subtotal-row td {
      border-top: 1px solid #999;
      padding: 4px 6px;
      font-size: 7pt;
    }

    .rounding-row td {
      padding: 4px 6px;
      font-size: 7pt;
    }

    .total-row {
      background: #e8e8e8 !important;
      font-weight: bold;
      font-size: 9pt;
    }

    .total-row td {
      border-top: 2px solid #333;
      padding: 6px;
    }

    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #ccc;
      text-align: center;
      font-size: 7pt;
      color: #666;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;
}