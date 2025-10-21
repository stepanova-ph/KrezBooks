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
      };
    };
  }
}

export {};