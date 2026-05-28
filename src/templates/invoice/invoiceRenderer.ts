import { loadTemplate, loadStyles } from "../../utils/templateLoader";
import type { InvoicePrintData, InvoiceItemRow, InvoiceTotals, VatRecapRow } from "../../service/printService";
import { COMPANY_INFO } from "../../config/companyInfo";
import path from "path";
import fs from "fs";

/**
 * Format Czech date
 */
function formatDate(dateString?: string): string {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("cs-CZ");
}

/**
 * Format currency with symbol
 */
function formatCurrency(amount: number, currencySymbol: string = "Kč"): string {
	return amount.toLocaleString("cs-CZ", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}) + ` ${currencySymbol}`;
}

/**
 * Replace placeholders in template with actual values
 */
function replacePlaceholders(template: string, values: Record<string, string>): string {
	let result = template;
	for (const [key, value] of Object.entries(values)) {
		result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
	}
	return result;
}

/**
 * Generate page header HTML
 */
function generatePageHeader(
	data: InvoicePrintData,
	pageNumber: number,
	totalPages: number,
): string {
	const { invoice, seller, buyer } = data;

	// Build absolute path to logo file and load it as data URI
	// In Electron, when bundled, the code runs from dist/main/, and assets are at dist/assets/
	const logoPath = path.resolve(__dirname, "../assets", "krezbo_logo.svg");
	let logoUri = "";

	try {
		if (fs.existsSync(logoPath)) {
			const svgContent = fs.readFileSync(logoPath, "utf-8");
			// Encode SVG as data URI
			const base64 = Buffer.from(svgContent).toString("base64");
			logoUri = `data:image/svg+xml;base64,${base64}`;
		}
	} catch (error) {
		console.error("Failed to load logo:", error);
	}

	return `
    <div class="header">
      <div class="header-row">
        <div class="invoice-title-line">
          <h1 class="invoice-title">FAKTURA</h1>
          <span class="invoice-number">${invoice.prefix}${invoice.number}</span>
        </div>

        <div class="company-branding">
          ${logoUri ? `<img src="${logoUri}" alt="${seller.companyName}" class="company-logo" />` : ""}
        </div>
      </div>

      <div class="parties-section">
        <div class="party-box party-supplier">
          <h3 class="party-title">Dodavatel</h3>
          <div class="party-content">
            <div class="party-group">
              <table class="party-details"><tbody>
                <tr><td class="party-label">IČO:</td><td>${seller.ico}</td></tr>
                ${seller.dic ? `<tr><td class="party-label">DIČ:</td><td>${seller.dic}</td></tr>` : ""}
              </tbody></table>
              <p class="party-name">${seller.ownerName}</p>
              <p class="party-name">${seller.companyName}</p>
              <p>${seller.street}</p>
              <p>${seller.city}, ${seller.postalCode}</p>
            </div>
            <div class="party-group">
              <table class="party-details"><tbody>
                <tr><td class="party-label">Účet:</td><td>${seller.bankAccount}</td></tr>
                ${invoice.is_in_eur && seller.iban ? `<tr><td class="party-label">IBAN:</td><td>${seller.iban}</td></tr>` : ""}
                ${invoice.is_in_eur && seller.bic ? `<tr><td class="party-label">BIC:</td><td>${seller.bic}</td></tr>` : ""}
              </tbody></table>
            </div>
            <div class="party-group">
              <table class="party-details"><tbody>
                <tr><td class="party-label">Tel:</td><td>${seller.phone}${seller.phone2 ? ` / ${seller.phone2}` : ""}</td></tr>
                <tr><td class="party-label">Email:</td><td>${seller.email}</td></tr>
              </tbody></table>
            </div>
          </div>
        </div>

        <div class="party-box party-buyer">
          <h3 class="party-title">Odběratel</h3>
          <div class="party-content">
            <div class="party-group">
              ${buyer.ico || buyer.dic ? `
              <table class="party-details"><tbody>
                ${buyer.ico ? `<tr><td class="party-label">IČO:</td><td>${buyer.ico}</td></tr>` : ""}
                ${buyer.dic ? `<tr><td class="party-label">DIČ:</td><td>${buyer.dic}</td></tr>` : ""}
              </tbody></table>
              ` : ""}
              <p class="party-name">${buyer.companyName}</p>
              ${buyer.street ? `<p>${buyer.street}</p>` : ""}
              ${buyer.city && buyer.postalCode ? `<p>${buyer.city}, ${buyer.postalCode}</p>` : ""}
            </div>
            ${buyer.bankAccount ? `
            <div class="party-group">
              <table class="party-details"><tbody>
                <tr><td class="party-label">Účet:</td><td>${buyer.bankAccount}</td></tr>
              </tbody></table>
            </div>
            ` : ""}
            ${buyer.phone || buyer.email ? `
            <div class="party-group">
              <table class="party-details"><tbody>
                ${buyer.phone ? `<tr><td class="party-label">Tel:</td><td>${buyer.phone}</td></tr>` : ""}
                ${buyer.email ? `<tr><td class="party-label">Email:</td><td>${buyer.email}</td></tr>` : ""}
              </tbody></table>
            </div>
            ` : ""}
          </div>
        </div>
      </div>

      <div class="meta-box">
        <table class="invoice-meta-table">
          <tr>
            <td class="meta-label">Číslo faktury:</td>
            <td class="meta-value">${invoice.prefix}${invoice.number}</td>
            <td class="meta-label">Datum vystavení:</td>
            <td class="meta-value">${formatDate(invoice.date_issue)}</td>
          </tr>
          <tr>
            <td class="meta-label">${invoice.variable_symbol ? "Variabilní symbol:" : ""}</td>
            <td class="meta-value">${invoice.variable_symbol || ""}</td>
            <td class="meta-label">${invoice.date_tax ? "Datum zdanitelného plnění:" : ""}</td>
            <td class="meta-value">${invoice.date_tax ? formatDate(invoice.date_tax) : ""}</td>
          </tr>
          <tr>
            <td class="meta-label">${invoice.payment_method !== undefined ? "Způsob úhrady:" : ""}</td>
            <td class="meta-value">${invoice.payment_method !== undefined ? (invoice.payment_method === 0 ? "Hotovost" : invoice.payment_method === 1 ? "Bankovní převod" : "Karta") : ""}</td>
            <td class="meta-label">${invoice.date_due ? "Datum splatnosti:" : ""}</td>
            <td class="meta-value">${invoice.date_due ? formatDate(invoice.date_due) : ""}</td>
          </tr>
          ${invoice.order_number ? `
          <tr>
            <td class="meta-label">Číslo objednávky:</td>
            <td class="meta-value">${invoice.order_number}</td>
            <td class="meta-label"></td>
            <td class="meta-value"></td>
          </tr>
          ` : ""}
        </table>
      </div>
    </div>
  `;
}

/**
 * Generate items table HTML
 */
function generateItemsTable(
	items: InvoiceItemRow[],
	totals: InvoiceTotals | null,
	currencySymbol: string,
): string {
	const itemsRows = items
		.map(
			(item) => `
    <tr>
      <td class="item-name">${item.name}</td>
      <td class="number">${item.amount} ${item.unit}</td>
      <td class="number">${formatCurrency(item.priceWithoutVat, currencySymbol)}</td>
      <td class="number">${formatCurrency(item.priceWithoutVat * item.amount, currencySymbol)}</td>
      <td class="number">${item.vatRate}%</td>
      <td class="number">${formatCurrency(item.vatAmount, currencySymbol)}</td>
      <td class="number"><strong>${formatCurrency(item.totalWithVat, currencySymbol)}</strong></td>
    </tr>
  `,
		)
		.join("");

	const subtotalRow = totals
		? `
    <tr class="subtotal-row">
      <td colspan="6"><strong>Mezisoučet:</strong></td>
      <td class="number"><strong>${formatCurrency(totals.totalBeforeRounding, currencySymbol)}</strong></td>
    </tr>
  `
		: "";

	return `
    <table class="invoice-table">
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
        ${subtotalRow}
      </tbody>
    </table>
  `;
}

/**
 * Generate VAT recapitulation and totals section HTML
 * Row 1: VAT recap on left, empty on right
 * Row 2: Signature on left, totals on right
 */
function generateVatRecapAndTotals(
	vatRecap: VatRecapRow[],
	totals: InvoiceTotals,
	currencySymbol: string,
): string {
	const recapRows = vatRecap
		.map(
			(row) => `
    <tr>
      <td>${formatCurrency(row.baseAmount, currencySymbol)}</td>
      <td class="center">${row.vatRate}%</td>
      <td>${formatCurrency(row.vatAmount, currencySymbol)}</td>
      <td><strong>${formatCurrency(row.totalAmount, currencySymbol)}</strong></td>
    </tr>
  `,
		)
		.join("");

	return `
    <div class="summary-wrapper">
      <div class="summary-row">
        <div class="vat-recap-column">
          <div class="vat-recap-title">Rekapitulace DPH:</div>
          <table class="vat-recap-table">
            <thead>
              <tr>
                <th>Základ</th>
                <th class="center">Sazba DPH</th>
                <th>DPH</th>
                <th>Celkem s DPH</th>
              </tr>
            </thead>
            <tbody>
              ${recapRows}
            </tbody>
          </table>
        </div>
        <div class="empty-column"></div>
      </div>

      <div class="summary-row">
        <div class="signature-column">
          <div class="signature-section">
            <div class="signature-space"></div>
            <div class="signature-line"></div>
            <div class="signature-label">Podpis a razítko</div>
          </div>
        </div>

        <div class="totals-column">
          <table class="totals-table">
            <tbody>
              <tr>
                <td><strong>Součet:</strong></td>
                <td class="number"><strong>${formatCurrency(totals.totalBeforeRounding, currencySymbol)}</strong></td>
              </tr>
              <tr>
                <td><strong>Zaokrouhlení:</strong></td>
                <td class="number"><strong>${formatCurrency(totals.rounding, currencySymbol)}</strong></td>
              </tr>
              <tr class="total-row">
                <td><strong>CELKEM K ÚHRADĚ:</strong></td>
                <td class="number"><strong>${formatCurrency(totals.totalWithVat, currencySymbol)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate footer HTML (only on last page)
 */
function generateFooter(pageNumber: number, totalPages: number, invoiceNote?: string): string {
	return `
    <div class="footer">
      <div class="invoice-notes">
        ${COMPANY_INFO.invoiceNotes.split('\n').join('<br>')}
        ${invoiceNote ? `<br><br>${invoiceNote.split('\n').join('<br>')}` : ''}
      </div>

      <div class="issued-by">
        Vystavil/a: ${COMPANY_INFO.invoiceIssuedBy}
      </div>

      <div class="page-footer">${pageNumber}/${totalPages}</div>
    </div>
  `;
}

/**
 * Generate a single page HTML
 */
function generatePage(
	data: InvoicePrintData,
	pageItems: InvoiceItemRow[],
	pageNumber: number,
	totalPages: number,
	isLastPage: boolean,
	isFirstPage: boolean,
): string {
	return `
    <div class="page">
      ${isFirstPage ? generatePageHeader(data, pageNumber, totalPages) : ""}
      ${generateItemsTable(pageItems, isLastPage ? data.totals : null, data.currency.symbol)}
      ${isLastPage ? generateVatRecapAndTotals(data.vatRecap, data.totals, data.currency.symbol) : ""}
      ${isLastPage ? generateFooter(pageNumber, totalPages, data.invoice.note) : `<div class="page-footer">${pageNumber}/${totalPages}</div>`}
    </div>
  `;
}

/**
 * Render complete invoice HTML
 */
export function renderInvoice(
	data: InvoicePrintData,
	pages: InvoiceItemRow[][],
): string {
	const template = loadTemplate("invoice/invoice.html");
	const styles = loadStyles("invoice/invoice.css");

	const totalPages = pages.length;

	const pagesHTML = pages
		.map((pageItems, pageIndex) => {
			const isLastPage = pageIndex === totalPages - 1;
			const isFirstPage = pageIndex === 0;
			const pageNumber = pageIndex + 1;

			return generatePage(data, pageItems, pageNumber, totalPages, isLastPage, isFirstPage);
		})
		.join("");

	return replacePlaceholders(template, {
		INVOICE_TITLE: `Faktura ${data.invoice.prefix}${data.invoice.number}`,
		STYLES: styles,
		PAGES: pagesHTML,
	});
}
