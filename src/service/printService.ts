import { Invoice, StockMovement } from "../types/database";
import { VAT_RATES } from "../config/constants";
import { COMPANY_INFO } from "../config/companyInfo";
import { getDisplayAmount } from "../utils/typeConverterUtils";

export interface InvoiceItemRow {
	name: string;
	amount: number;
	priceWithoutVat: number;
	vatAmount: number;
	priceWithVat: number;
	totalWithVat: number;
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
 * Calculate invoice items with VAT
 */
function calculateInvoiceItems(
	stockMovements: StockMovement[],
	itemNames: Map<string, string>,
	invoiceType: number, // ADD THIS PARAMETER
): InvoiceItemRow[] {
	return stockMovements.map((movement) => {
		const vatRate = VAT_RATES[movement.vat_rate].percentage / 100;
		const priceWithoutVat = Number(movement.price_per_unit);
		
		// Use getDisplayAmount to handle negative amounts for sale invoices
		const displayAmount = getDisplayAmount(Number(movement.amount), invoiceType);
		
		const totalWithoutVat = priceWithoutVat * displayAmount;
		const vatAmount = totalWithoutVat * vatRate;
		const priceWithVat = priceWithoutVat * (1 + vatRate);
		const totalWithVat = totalWithoutVat * (1 + vatRate);

		return {
			name: itemNames.get(movement.item_ean) || movement.item_ean,
			amount: displayAmount, // Changed from movement.amount
			priceWithoutVat,
			vatAmount,
			priceWithVat,
			totalWithVat,
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
 */
export function prepareInvoicePrintData(
	invoice: Invoice,
	stockMovements: StockMovement[],
	itemNames: Map<string, string>,
): InvoicePrintData {
	const items = calculateInvoiceItems(
        stockMovements, 
        itemNames,
        invoice.type as number);
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
        <div class="company-info">
          <h1>${seller.companyName}</h1>
          <p>IČO: ${seller.ico}</p>
          <p>DIČ: ${seller.dic}</p>
          <p>${seller.street}</p>
          <p>${seller.city}, ${seller.postalCode}</p>
        </div>
        <div class="invoice-title">
          <h1>FAKTURA</h1>
          <p class="invoice-number">${invoice.prefix}${invoice.number}</p>
          ${totalPages > 1 ? `<p class="page-number">Strana ${pageNumber} / ${totalPages}</p>` : ""}
        </div>
      </div>

      <div class="details-grid">
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

        <div class="detail-section">
          <h3>Údaje faktury</h3>
          <p><strong>Číslo faktury:</strong> ${invoice.prefix}${invoice.number}</p>
          ${invoice.variable_symbol ? `<p><strong>Variabilní symbol:</strong> ${invoice.variable_symbol}</p>` : ""}
          <p><strong>Datum vystavení:</strong> ${formatDate(invoice.date_issue)}</p>
          ${invoice.date_tax ? `<p><strong>Datum zdanitelného plnění:</strong> ${formatDate(invoice.date_tax)}</p>` : ""}
          ${invoice.date_due ? `<p><strong>Datum splatnosti:</strong> ${formatDate(invoice.date_due)}</p>` : ""}
          ${invoice.payment_method !== undefined ? `<p><strong>Způsob platby:</strong> ${invoice.payment_method === 0 ? "Hotovost" : "Bankovní převod"}</p>` : ""}
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
      <td class="number">${item.amount}</td>
      <td class="number">${formatCurrency(item.priceWithoutVat)}</td>
      <td class="number">${formatCurrency(item.vatAmount)}</td>
      <td class="number">${formatCurrency(item.priceWithVat)}</td>
      <td class="number"><strong>${formatCurrency(item.totalWithVat)}</strong></td>
    </tr>
  `,
		)
		.join("");

	const totalsRow = totals
		? `
    <tr class="totals-row">
      <td colspan="2"><strong>Celkem:</strong></td>
      <td class="number"><strong>${formatCurrency(totals.totalWithoutVat)}</strong></td>
      <td class="number"><strong>${formatCurrency(totals.totalVatAmount)}</strong></td>
      <td></td>
      <td class="number"><strong>${formatCurrency(totals.totalWithVat)}</strong></td>
    </tr>
  `
		: "";

	return `
    <table class="items-table">
      <thead>
        <tr>
          <th>Název položky</th>
          <th class="number">Množství</th>
          <th class="number">Cena bez DPH</th>
          <th class="number">DPH (Kč)</th>
          <th class="number">Cena s DPH</th>
          <th class="number">Celkem s DPH</th>
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
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
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
      margin-bottom: 20px;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 3px solid #333;
    }

    .company-info h1 {
      font-size: 16pt;
      margin-bottom: 5px;
    }

    .company-info p {
      font-size: 10pt;
      margin: 2px 0;
    }

    .invoice-title {
      text-align: right;
    }

    .invoice-title h1 {
      font-size: 24pt;
      margin-bottom: 5px;
    }

    .invoice-number {
      font-size: 14pt;
      font-weight: bold;
    }

    .page-number {
      font-size: 10pt;
      color: #666;
      margin-top: 5px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-bottom: 25px;
    }

    .detail-section {
      border: 1px solid #ddd;
      padding: 10px;
      background: #f9f9f9;
    }

    .detail-section h3 {
      font-size: 11pt;
      margin-bottom: 8px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ccc;
    }

    .detail-section p {
      font-size: 9pt;
      margin: 3px 0;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10pt;
    }

    .items-table th {
      background: #333;
      color: white;
      padding: 8px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #333;
    }

    .items-table th.number {
      text-align: right;
    }

    .items-table td {
      padding: 6px 8px;
      border: 1px solid #ddd;
    }

    .items-table td.number {
      text-align: right;
      white-space: nowrap;
    }

    .items-table td.item-name {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .items-table tbody tr:nth-child(even) {
      background: #f9f9f9;
    }

    .totals-row {
      background: #e8e8e8 !important;
      font-weight: bold;
    }

    .totals-row td {
      border-top: 2px solid #333;
      padding: 10px 8px;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ccc;
      text-align: center;
      font-size: 9pt;
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