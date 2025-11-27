import { contextBridge, ipcRenderer } from "electron";
import type {
	Contact,
	Item,
	CreateContactInput,
	CreateItemInput,
	StockMovement,
	Invoice,
	CreateInvoiceInput,
	CreateStockMovementInput,
} from "../types/database";

contextBridge.exposeInMainWorld("electronAPI", {
	ipcRenderer: {
		send: (channel: string, data: any) => {
			const validChannels = [
				"window-minimize",
				"window-maximize",
				"window-close",
			];
			if (validChannels.includes(channel)) {
				ipcRenderer.send(channel, data);
			}
		},
		on: (channel: string, func: (arg0: any) => void) => {
			const validChannels: string | string[] = [];
			if (validChannels.includes(channel)) {
				ipcRenderer.on(channel, (event, ...args) => func(...args));
			}
		},
	},
	testDatabase: () => ipcRenderer.invoke("db:test"),

	dialog: {
		selectDirectory: (title?: string) =>
			ipcRenderer.invoke("dialog:selectDirectory", title),
		saveFile: (defaultFilename?: string, title?: string) =>
			ipcRenderer.invoke("dialog:saveFile", defaultFilename, title),
	},

	contacts: {
		getAll: () => ipcRenderer.invoke("db:contacts:getAll"),
		getOne: (ico: string, modifier: number) =>
			ipcRenderer.invoke("db:contacts:getOne", ico, modifier),
		create: (contact: CreateContactInput) =>
			ipcRenderer.invoke("db:contacts:create", contact),
		update: (ico: string, modifier: number, updates: Partial<Contact>) =>
			ipcRenderer.invoke("db:contacts:update", ico, modifier, updates),
		delete: (ico: string, modifier: number) =>
			ipcRenderer.invoke("db:contacts:delete", ico, modifier),
	},

	items: {
		getAll: () => ipcRenderer.invoke("db:items:getAll"),
		getOne: (ean: string) => ipcRenderer.invoke("db:items:getOne", ean),
		getCategories: () => ipcRenderer.invoke("db:items:getCategories"),
		create: (item: CreateItemInput) =>
			ipcRenderer.invoke("db:items:create", item),
		update: (ean: string, updates: Partial<Item>) =>
			ipcRenderer.invoke("db:items:update", ean, updates),
		delete: (ean: string) => ipcRenderer.invoke("db:items:delete", ean),
	},

	admin: {
		getDbStats: () => ipcRenderer.invoke("db:getStats"),
		clearDb: () => ipcRenderer.invoke("db:clearDatabase"),
		fillTestData: () => ipcRenderer.invoke("db:fillTestData"),
		recreateTables: () => ipcRenderer.invoke("db:recreateTables"),
	},

	importExport: {
		exportData: (directoryPath: string) =>
			ipcRenderer.invoke("db:exportData", directoryPath),
		importLegacyData: (directoryPath: string) =>
			ipcRenderer.invoke("db:importLegacyData", directoryPath),
		importData: (directoryPath: string) =>
			ipcRenderer.invoke("db:importData", directoryPath),
		onExportProgress: (
			callback: (data: { message: string; progress: number }) => void,
		) => {
			const listener = (
				_event: any,
				data: { message: string; progress: number },
			) => callback(data);
			ipcRenderer.on("export:progress", listener);
			return () => ipcRenderer.removeListener("export:progress", listener);
		},
		onImportProgress: (
			callback: (data: { message: string; progress: number }) => void,
		) => {
			const listener = (
				_event: any,
				data: { message: string; progress: number },
			) => callback(data);
			ipcRenderer.on("import:progress", listener);
			return () => ipcRenderer.removeListener("import:progress", listener);
		},
		onExportComplete: (callback: (data: any) => void) => {
			const listener = (_event: any, data: any) => callback(data);
			ipcRenderer.on("export:complete", listener);
			return () => ipcRenderer.removeListener("export:complete", listener);
		},
		onImportComplete: (callback: (data: any) => void) => {
			const listener = (_event: any, data: any) => callback(data);
			ipcRenderer.on("import:complete", listener);
			return () => ipcRenderer.removeListener("import:complete", listener);
		},
	},

	invoices: {
		getAll: () => ipcRenderer.invoke("db:invoices:getAll"),
		getOne: (prefix: string, number: string) =>
			ipcRenderer.invoke("db:invoices:getOne", prefix, number),
		create: (invoice: CreateInvoiceInput) =>
			ipcRenderer.invoke("db:invoices:create", invoice),
		update: (number: string, updates: Partial<Invoice>) =>
			ipcRenderer.invoke("db:invoices:update", number, updates),
		delete: (prefix: string, number: string) =>
			ipcRenderer.invoke("db:invoices:delete", number),
		getMaxNumber: (type: number) =>
			ipcRenderer.invoke("db:invoices:getMaxNumber", type),
	},

	stockMovements: {
		getAll: () => ipcRenderer.invoke("db:stockMovements:getAll"),
		getOne: (invoicePrefix: string, invoiceNumber: string, itemEan: string) =>
			ipcRenderer.invoke(
				"db:stockMovements:getOne",
				invoicePrefix,
				invoiceNumber,
				itemEan,
			),
		create: (movement: CreateStockMovementInput) =>
			ipcRenderer.invoke("db:stockMovements:create", movement),
		update: (
			invoicePrefix: string,
			invoiceNumber: string,
			itemEan: string,
			updates: Partial<StockMovement>,
		) =>
			ipcRenderer.invoke(
				"db:stockMovements:update",
				invoicePrefix,
				invoiceNumber,
				itemEan,
				updates,
			),
		delete: (invoicePrefix: string, invoiceNumber: string, itemEan: string) =>
			ipcRenderer.invoke(
				"db:stockMovements:delete",
				invoicePrefix,
				invoiceNumber,
				itemEan,
			),
		getByInvoice: (invoicePrefix: string, invoiceNumber: string) =>
			ipcRenderer.invoke(
				"db:stockMovements:getByInvoice",
				invoicePrefix,
				invoiceNumber,
			),

		getStockAmountByItem: (ean: string) =>
			ipcRenderer.invoke("db:stockMovements:getStockAmountByItem", ean),

		getAverageBuyPriceByItem: (ean: string) =>
			ipcRenderer.invoke("db:stockMovements:getAverageBuyPriceByItem", ean),

		getLastBuyPriceByItem: (ean: string) =>
			ipcRenderer.invoke("db:stockMovements:getLastBuyPriceByItem", ean),

		shouldSetResetPoint: (itemEan: string, newAmount: string) =>
			ipcRenderer.invoke(
				"db:stockMovements:shouldSetResetPoint",
				itemEan,
				newAmount,
			),

		getByItemWithInvoiceInfo: (itemEan: string) =>
			ipcRenderer.invoke("db:stockMovements:getByItemWithInvoiceInfo", itemEan),
	},

	backup: {
		getPath: () => ipcRenderer.invoke("backup:getPath"),
		setPath: (backupPath: string) =>
			ipcRenderer.invoke("backup:setPath", backupPath),
		create: () => ipcRenderer.invoke("backup:create"),
	},
	print: {
		generateInvoiceHTML: (invoicePrefix: string, invoiceNumber: string) =>
			ipcRenderer.invoke(
				"print:generateInvoiceHTML",
				invoicePrefix,
				invoiceNumber,
			),
		invoiceToPDF: (
			invoicePrefix: string,
			invoiceNumber: string,
			savePath?: string,
		) =>
			ipcRenderer.invoke(
				"print:invoiceToPDF",
				invoicePrefix,
				invoiceNumber,
				savePath,
			),
	},
	shell: {
		openEmail: (email: string, subject: string, body: string) =>
			ipcRenderer.invoke("shell:openEmail", email, subject, body),
	},
});
