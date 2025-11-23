import type {
	Contact,
	Item,
	CreateContactInput,
	CreateItemInput,
	StockMovement,
	Invoice,
	CreateInvoiceInput,
	CreateStockMovementInput,
} from "./database";

export interface IpcResponse<T = any> {
	success: boolean;
	canceled?: boolean;
	data?: T;
	error?: string;
}

export interface ImportDataResult {
	success: boolean;
	canceled?: boolean;
	imported?: {
		contacts: number;
		items: number;
		invoices: number;
		stock_movements: number;
	};
	skipped?: {
		contacts: number;
		items: number;
		invoices: number;
		stock_movements: number;
	};
	logFile?: string;
	error?: string;
}

export interface ImportLegacyDataResult {
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

export interface ExportDataResult {
	success: boolean;
	canceled?: boolean;
	error?: string;
	path?: string;
}

declare global {
	interface Window {
		electronAPI: {
			ipcRenderer: {
				send: (channel: string, data: any) => void;
				on: (channel: string, func: (arg0: any) => void) => void;
			};
			testDatabase: () => Promise<IpcResponse>;
			dialog: {
				selectDirectory: (title?: string) => Promise<{
					success: boolean;
					canceled?: boolean;
					path?: string;
					error?: string;
				}>;
			};
			contacts: {
				getAll: () => Promise<IpcResponse<Contact[]>>;
				getOne: (ico: string, modifier: number) => Promise<IpcResponse<Contact>>;
				create: (contact: CreateContactInput) => Promise<IpcResponse<Contact>>;
				update: (
					ico: string,
					modifier: number,
					updates: Partial<Contact>,
				) => Promise<IpcResponse<Contact>>;
				delete: (ico: string, modifier: number) => Promise<IpcResponse>;
			};
			items: {
				getAll: () => Promise<IpcResponse<Item[]>>;
				getOne: (ean: string) => Promise<IpcResponse<Item>>;
				getCategories: () => Promise<IpcResponse<string[]>>;
				create: (item: CreateItemInput) => Promise<IpcResponse<Item>>;
				update: (ean: string, updates: Partial<Item>) => Promise<IpcResponse<Item>>;
				delete: (ean: string) => Promise<IpcResponse>;
			};
			admin: {
				getDbStats: () => Promise<
					IpcResponse<{
						contacts: number;
						items: number;
						stockMovements: number;
						invoices: number;
					}>
				>;
				clearDb: () => Promise<IpcResponse>;
				fillTestData: () => Promise<
					IpcResponse<{
						contactsAdded: number;
						itemsAdded: number;
						invoicesAdded: number;
						stockMovementsAdded: number;
					}>
				>;
				recreateTables: () => Promise<IpcResponse>;
			};
			importExport: {
				exportData: (directoryPath: string) => Promise<{ success: boolean; started?: boolean; error?: string }>;
				importLegacyData: (directoryPath: string) => Promise<{ success: boolean; started?: boolean; error?: string }>;
				importData: (directoryPath: string) => Promise<{ success: boolean; started?: boolean; error?: string }>;
				onExportProgress: (
					callback: (data: { message: string; progress: number }) => void,
				) => () => void;
				onImportProgress: (
					callback: (data: { message: string; progress: number }) => void,
				) => () => void;
				onExportComplete: (
					callback: (data: ExportDataResult) => void,
				) => () => void;
				onImportComplete: (
					callback: (data: ImportDataResult | ImportLegacyDataResult) => void,
				) => () => void;
			};
			invoices: {
				getAll: () => Promise<IpcResponse<Invoice[]>>;
				getOne: (prefix: string, number: string) => Promise<IpcResponse<Invoice>>;
				create: (invoice: CreateInvoiceInput) => Promise<IpcResponse<Invoice>>;
				update: (
					number: string,
					updates: Partial<Invoice>,
				) => Promise<IpcResponse<Invoice>>;
				delete: (prefix: string, number: string) => Promise<IpcResponse>;
				getMaxNumber: (type: number) => Promise<IpcResponse<number>>;
			};
			stockMovements: {
				getAll: () => Promise<IpcResponse<StockMovement[]>>;
				getOne: (
					invoicePrefix: string,
					invoiceNumber: string,
					itemEan: string,
				) => Promise<IpcResponse<StockMovement>>;
				create: (
					movement: CreateStockMovementInput,
				) => Promise<IpcResponse<StockMovement>>;
				update: (
					invoicePrefix: string,
					invoiceNumber: string,
					itemEan: string,
					updates: Partial<StockMovement>,
				) => Promise<IpcResponse<StockMovement>>;
				delete: (
					invoicePrefix: string,
					invoiceNumber: string,
					itemEan: string,
				) => Promise<IpcResponse>;
				getByInvoice: (
					invoicePrefix: string,
					invoiceNumber: string,
				) => Promise<IpcResponse<StockMovement[]>>;
				getStockAmountByItem: (ean: string) => Promise<IpcResponse<number>>;
				getAverageBuyPriceByItem: (ean: string) => Promise<IpcResponse<number>>;
				getLastBuyPriceByItem: (ean: string) => Promise<IpcResponse<number>>;
				shouldSetResetPoint: (
					itemEan: string,
					newAmount: string,
				) => Promise<IpcResponse<boolean>>;
				getByItemWithInvoiceInfo: (
					itemEan: string,
				) => Promise<IpcResponse<any[]>>;
			};
		};
	}
}
