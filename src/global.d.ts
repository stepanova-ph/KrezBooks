import type {
  Contact,
  Item,
  CreateContactInput,
  CreateItemInput,
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
          modifier: number
        ) => Promise<IpcResponse<Contact | null>>;
        create: (
          contact: CreateContactInput
        ) => Promise<IpcResponse<{ changes: number }>>;
        update: (
          ico: string,
          modifier: number,
          updates: Partial<Contact>
        ) => Promise<IpcResponse<{ changes: number }>>;
        delete: (
          ico: string,
          modifier: number
        ) => Promise<IpcResponse<{ changes: number }>>;
      };

      items: {
        getCategories: () => Promise<IpcResponse<string[]>>;
        getAll: () => Promise<IpcResponse<Item[]>>;
        getOne: (ean: string) => Promise<IpcResponse<Item | null>>;
        create: (
          item: CreateItemInput
        ) => Promise<IpcResponse<{ changes: number }>>;
        update: (
          ean: string,
          updates: Partial<Item>
        ) => Promise<IpcResponse<{ changes: number }>>;
        delete: (ean: string) => Promise<IpcResponse<{ changes: number }>>;
      };

      admin: {
        getDbStats: () => Promise<IpcResponse<{ contacts: number; items: number, stockMovements: number, invoices: number }>>;
        clearDb: () => Promise<IpcResponse<{ changes: number }>>;
        fillTestData: () => Promise<IpcResponse<{ contactsAdded: number; itemsAdded: number }>>;
        recreateTables: () => Promise<IpcResponse<{}>>;
      };

      stockMovements:{
        getAll: () => Promise<IPCResponse<StockMovement[]>>;
        getOne: (invoiceNumber: string, itemEan: string) => Promise<IPCResponse<StockMovement>>;
        getByInvoice: (invoiceNumber: string) => Promise<IPCResponse<StockMovement[]>>;
        getByItem: (itemEan: string) => Promise<IPCResponse<StockMovement[]>>;
        getStockAmountByItem: (itemEan: string) => Promise<IPCResponse<number>>;
        getAverageBuyPriceByItem: (itemEan: string) => Promise<IPCResponse<number>>;
        getLastBuyPriceByItem: (itemEan: string) => Promise<IPCResponse<number>>;
        create: (movement: CreateStockMovementInput) => Promise<IPCResponse<{ changes: number }>>;
        update: (
          invoiceNumber: string,
          itemEan: string,
          updates: Partial<StockMovement>
        ) => Promise<IPCResponse<{ changes: number }>>;
        delete: (invoiceNumber: string, itemEan: string) => Promise<IPCResponse<{ changes: number }>>;
        deleteByInvoice: (invoiceNumber: string) => Promise<IPCResponse<{ changes: number }>>;
      }

      invoices: {
        getAll: () => Promise<IpcResponse<Invoice[]>>;
        getOne: (number: string) => Promise<IpcResponse<Invoice | null>>;
        create: (invoice: CreateInvoiceInput) => Promise<IpcResponse<{ changes: number }>>;
        update: (number: string, updates: Partial<Invoice>) => Promise<IpcResponse<{ changes: number }>>;
        delete: (number: string) => Promise<IpcResponse<{ changes: number }>>;
        getByInvoice: (invoiceNumber: string) => Promise<IpcResponse<StockMoveent[]>>;
        getAverageBuyPriceByItem: (ean: string) => Promise<IpcResponse<number>>;
        getLastBuyPriceByItem: (ean: string) => Promise<IpcResponse<number>>;
      }
    };

    
  }
}

export {};