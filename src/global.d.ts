import type {
  Contact,
  Item,
  CreateContactInput,
  CreateItemInput,
} from "./types/database";

declare global {
  interface Window {
    electronAPI: {
      ipcRenderer;
      testDatabase: () => Promise<{
        success: boolean;
        result?: any;
        error?: string;
      }>;

      contacts: {
        getAll: () => Promise<Contact[]>;
        getOne: (ico: string, modifier: number) => Promise<Contact | undefined>;
        create: (
          contact: CreateContactInput,
        ) => Promise<{ success: boolean; changes: number }>;
        update: (
          ico: string,
          modifier: number,
          updates: Partial<Contact>,
        ) => Promise<{ success: boolean; changes: number }>;
        delete: (
          ico: string,
          modifier: number,
        ) => Promise<{ success: boolean; changes: number }>;
      };

      items: {
        getAll: () => Promise<Item[]>;
        getOne: (id: number) => Promise<Item | undefined>;
        create: (
          item: CreateItemInput,
        ) => Promise<{ success: boolean; id: number; changes: number }>;
        update: (
          id: number,
          updates: Partial<Item>,
        ) => Promise<{ success: boolean; changes: number }>;
        delete: (id: number) => Promise<{ success: boolean; changes: number }>;
      };

      admin: {
        getDbStats: () => Promise<{
          success: boolean;
          data: { contacts: number; items: number };
          error?: string;
        }>;
        clearDb: () => Promise<{
          success: boolean;
          changes: number;
          error?: string;
        }>;
        fillTestData: () => Promise<{
          success: boolean;
          data: { contactsAdded: number; itemsAdded: number };
          error?: string;
        }>;
      };
    };
  }
}

export {};
