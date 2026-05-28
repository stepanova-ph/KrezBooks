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
					throw new Error("Faktura nenalezena");
				}

				const stockMovements = await stockMovementService.getByInvoice(
					invoicePrefix,
					invoiceNumber,
				);

				const items = await itemService.getAll();
				const itemNames = new Map(items.map((item) => [item.ean, item.name]));
				const itemUnits = new Map(items.map((item) => [item.ean, item.unit_of_measure || "ks"]));

				const printData = prepareInvoicePrintData(
					invoice,
					stockMovements,
					itemNames,
					itemUnits,
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
					throw new Error("Faktura nenalezena");
				}

				const stockMovements = await stockMovementService.getByInvoice(
					invoicePrefix,
					invoiceNumber,
				);

				const items = await itemService.getAll();
				const itemNames = new Map(items.map((item) => [item.ean, item.name]));
				const itemUnits = new Map(items.map((item) => [item.ean, item.unit_of_measure || "ks"]));

				const printData = prepareInvoicePrintData(
					invoice,
					stockMovements,
					itemNames,
					itemUnits,
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
					margins: {
						top: 0,
						bottom: 0,
						left: 0,
						right: 0,
					},
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

	ipcMain.handle(
		"print:invoiceToSystemPrinter",
		async (
			_event,
			invoicePrefix: string,
			invoiceNumber: string,
		) => {
			return handleIpcRequest(async () => {
				const invoice = await invoiceService.getOne(
					invoicePrefix,
					invoiceNumber,
				);
				if (!invoice) {
					throw new Error("Faktura nenalezena");
				}

				const stockMovements = await stockMovementService.getByInvoice(
					invoicePrefix,
					invoiceNumber,
				);

				const items = await itemService.getAll();
				const itemNames = new Map(items.map((item) => [item.ean, item.name]));
				const itemUnits = new Map(items.map((item) => [item.ean, item.unit_of_measure || "ks"]));

				const printData = prepareInvoicePrintData(
					invoice,
					stockMovements,
					itemNames,
					itemUnits,
				);

				const html = generateInvoiceHTML(printData);
				const printWindow = new BrowserWindow({
					show: true,
					width: 800,
					height: 600,
					title: `Tisk faktury ${invoicePrefix}${invoiceNumber}`,
					webPreferences: {
						nodeIntegration: false,
						contextIsolation: true,
					},
				});

				await printWindow.loadURL(
					`data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
				);

				await new Promise((resolve) => setTimeout(resolve, 500));

				// Use window.print() via JavaScript - this always shows the native print dialog
				printWindow.webContents.executeJavaScript('window.print()');

				logger.info(`Print dialog opened for: ${invoicePrefix}${invoiceNumber}`);
				return { success: true };
			});
		},
	);

	logger.info("✓ Print handlers registered");
}