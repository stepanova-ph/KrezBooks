import type {
	Contact,
	Item,
	CreateContactInput,
	CreateItemInput,
	StockMovement,
	CreateStockMovementInput,
	Invoice,
	CreateInvoiceInput,
} from "./types/database";
import type { IpcResponse } from "./main/ipcWrapper";

declare global {
	interface Window {
		electronAPI: {
			ipcRenderer: any;

			testDatabase: () => Promise<IpcResponse<any>>;

			contacts: {
				getAll: () => Promise<IpcResponse<Contact[]>>;
				getOne: (
					ico: string,
					modifier: number,
				) => Promise<IpcResponse<Contact | null>>;
				create: (
					contact: CreateContactInput,
				) => Promise<IpcResponse<{ changes: number }>>;
				update: (
					ico: string,
					modifier: number,
					updates: Partial<Contact>,
				) => Promise<IpcResponse<{ changes: number }>>;
				delete: (
					ico: string,
					modifier: number,
				) => Promise<IpcResponse<{ changes: number }>>;
			};

			items: {
				getCategories: () => Promise<IpcResponse<string[]>>;
				getAll: () => Promise<IpcResponse<Item[]>>;
				getOne: (ean: string) => Promise<IpcResponse<Item | null>>;
				create: (
					item: CreateItemInput,
				) => Promise<IpcResponse<{ changes: number }>>;
				update: (
					ean: string,
					updates: Partial<Item>,
				) => Promise<IpcResponse<{ changes: number }>>;
				delete: (ean: string) => Promise<IpcResponse<{ changes: number }>>;
			};

			dialog: {
				selectDirectory: (title?: string) => Promise<{
					success: boolean;
					canceled?: boolean;
					path?: string;
					error?: string;
				}>;
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
				clearDb: () => Promise<IpcResponse<{ changes: number }>>;
				fillTestData: () => Promise<
					IpcResponse<{
						contactsAdded: number;
						itemsAdded: number;
						invoicesAdded: number;
						stockMovementsAdded: number;
					}>
				>;
				recreateTables: () => Promise<IpcResponse<{}>>;
			};

			importExport: {
				exportData: (directoryPath: string) => Promise<{
					success: boolean;
					started?: boolean;
					error?: string;
				}>;
				importLegacyData: (directoryPath: string) => Promise<{
					success: boolean;
					started?: boolean;
					error?: string;
				}>;
				importData: (directoryPath: string) => Promise<{
					success: boolean;
					started?: boolean;
					error?: string;
				}>;
				onExportProgress: (
					callback: (data: { message: string; progress: number }) => void,
				) => () => void;
				onImportProgress: (
					callback: (data: { message: string; progress: number }) => void,
				) => () => void;
				onExportComplete: (callback: (data: any) => void) => () => void;
				onImportComplete: (callback: (data: any) => void) => () => void;
			};

			stockMovements: {
				getAll: () => Promise<IpcResponse<StockMovement[]>>;
				getOne: (
					invoicePrefix: string,
					invoiceNumber: string,
					itemEan: string,
				) => Promise<IpcResponse<StockMovement>>;
				getByInvoice: (
					invoicePrefix: string,
					invoiceNumber: string,
				) => Promise<IpcResponse<StockMovement[]>>;
				getByItem: (itemEan: string) => Promise<IpcResponse<StockMovement[]>>;
				getStockAmountByItem: (itemEan: string) => Promise<IpcResponse<number>>;
				getAverageBuyPriceByItem: (
					itemEan: string,
				) => Promise<IpcResponse<number>>;
				getLastBuyPriceByItem: (
					itemEan: string,
				) => Promise<IpcResponse<number>>;
				shouldSetResetPoint: (
					itemEan: string,
					newAmount: string,
				) => Promise<IpcResponse<boolean>>;
				create: (
					movement: CreateStockMovementInput,
				) => Promise<IpcResponse<{ changes: number }>>;
				update: (
					invoicePrefix: string,
					invoiceNumber: string,
					itemEan: string,
					updates: Partial<StockMovement>,
				) => Promise<IpcResponse<{ changes: number }>>;
				delete: (
					invoicePrefix: string,
					invoiceNumber: string,
					itemEan: string,
				) => Promise<IpcResponse<{ changes: number }>>;
				deleteByInvoice: (
					invoicePrefix: string,
					invoiceNumber: string,
				) => Promise<IpcResponse<{ changes: number }>>;
				getByItemWithInvoiceInfo: (
					itemEan: string,
				) => Promise<IpcResponse<StockMovementWithInvoiceInfo[]>>;
			};

			invoices: {
				getAll: () => Promise<IpcResponse<Invoice[]>>;
				getOne: (prefix: string, number: string) => Promise<IpcResponse<Invoice | null>>;
				create: (
					invoice: CreateInvoiceInput,
				) => Promise<IpcResponse<{ changes: number }>>;
				update: (
					number: string,
					updates: Partial<Invoice>,
				) => Promise<IpcResponse<{ changes: number }>>;
				delete: (prefix: string, number: string) => Promise<IpcResponse<{ changes: number }>>;
				getByInvoice: (
					invoiceNumber: string,
				) => Promise<IpcResponse<StockMovement[]>>;
				getAverageBuyPriceByItem: (ean: string) => Promise<IpcResponse<number>>;
				getLastBuyPriceByItem: (ean: string) => Promise<IpcResponse<number>>;
				getMaxNumber: (type: number) => Promise<number>;
			};
		};
	}
}

export {};