import { ipcMain, BrowserWindow } from "electron";
import { handleIpcRequest } from "./ipcWrapper";
import { logger } from "./logger";
import {
	prepareInvoicePrintData,
	generateInvoiceHTML,
} from "../service/printService";
import { invoiceService, stockMovementService, itemService } from "../service";
import path from "path";
import fs from "fs";
import { app } from "electron";

export function registerPrintHandlers() {
	ipcMain.handle(
		"print:generateInvoiceHTML",
		async (_event, invoicePrefix: string, invoiceNumber: string) => {
			return handleIpcRequest(async () => {
				const invoice = await invoiceService.getOne(
					invoicePrefix,
					invoiceNumber,
				);
				if (!invoice) {
					throw new Error("Invoice not found");
				}

				const stockMovements = await stockMovementService.getByInvoice(
					invoicePrefix,
					invoiceNumber,
				);

				const items = await itemService.getAll();
				const itemNames = new Map(items.map((item) => [item.ean, item.name]));

				const printData = prepareInvoicePrintData(
					invoice,
					stockMovements,
					itemNames,
				);

				const html = generateInvoiceHTML(printData);
				return html;
			});
		},
	);

	ipcMain.handle(
		"print:invoiceToPDF",
		async (
			_event,
			invoicePrefix: string,
			invoiceNumber: string,
			savePath?: string,
		) => {
			return handleIpcRequest(async () => {
				const invoice = await invoiceService.getOne(
					invoicePrefix,
					invoiceNumber,
				);
				if (!invoice) {
					throw new Error("Invoice not found");
				}

				const stockMovements = await stockMovementService.getByInvoice(
					invoicePrefix,
					invoiceNumber,
				);

				const items = await itemService.getAll();
				const itemNames = new Map(items.map((item) => [item.ean, item.name]));

				const printData = prepareInvoicePrintData(
					invoice,
					stockMovements,
					itemNames,
				);

				const html = generateInvoiceHTML(printData);
				const printWindow = new BrowserWindow({
					show: false,
					webPreferences: {
						nodeIntegration: false,
						contextIsolation: true,
					},
				});

				await printWindow.loadURL(
					`data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
				);

				await new Promise((resolve) => setTimeout(resolve, 500));

				let pdfPath: string;
				if (savePath) {
					pdfPath = savePath;
				} else {
					const userDataPath = app.getPath("userData");
					const invoicesDir = path.join(userDataPath, "invoices");
					if (!fs.existsSync(invoicesDir)) {
						fs.mkdirSync(invoicesDir, { recursive: true });
					}
					pdfPath = path.join(
						invoicesDir,
						`Faktura_${invoicePrefix}${invoiceNumber}.pdf`,
					);
				}

				const data = await printWindow.webContents.printToPDF({
					marginsType: 0,
					pageSize: "A4",
					printBackground: true,
					landscape: false,
				});

				fs.writeFileSync(pdfPath, data);
				printWindow.close();
				logger.info(`Invoice PDF saved to: ${pdfPath}`);

				return { path: pdfPath };
			});
		},
	);

	logger.info("✓ Print handlers registered");
}