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
      
      // Test database connection
      testDatabase: () => Promise<IpcResponse<any>>;

      // Contact operations
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

      // Item operations
      items: {
        getAll: () => Promise<IpcResponse<Item[]>>;
        getOne: (id: number) => Promise<IpcResponse<Item | null>>;
        create: (
          item: CreateItemInput
        ) => Promise<IpcResponse<{ id: number; changes: number }>>;
        update: (
          id: number,
          updates: Partial<Item>
        ) => Promise<IpcResponse<{ changes: number }>>;
        delete: (id: number) => Promise<IpcResponse<{ changes: number }>>;
      };

      // Admin operations
      admin: {
        getDbStats: () => Promise<IpcResponse<{ contacts: number; items: number }>>;
        clearDb: () => Promise<IpcResponse<{ changes: number }>>;
        fillTestData: () => Promise<IpcResponse<{ contactsAdded: number; itemsAdded: number }>
        >;
      };
    };
  }
}

export {};