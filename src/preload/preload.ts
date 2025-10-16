import { contextBridge, ipcRenderer } from "electron";
import type {
  Contact,
  Item,
  CreateContactInput,
  CreateItemInput,
  UpdateContactInput,
  UpdateItemInput,
} from "../types/database";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  ipcRenderer: {
    send: (channel: string, data: any) => {
      // Whitelist channels for security
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

  contacts: {
    getAll: () =>
      ipcRenderer.invoke("db:contacts:getAll") as Promise<Contact[]>,

    getOne: (ico: string, modifier: number) =>
      ipcRenderer.invoke("db:contacts:getOne", ico, modifier) as Promise<
        Contact | undefined
      >,

    create: (contact: CreateContactInput) =>
      ipcRenderer.invoke("db:contacts:create", contact) as Promise<{
        success: boolean;
        changes: number;
      }>,

    update: (ico: string, modifier: number, updates: Partial<Contact>) =>
      ipcRenderer.invoke(
        "db:contacts:update",
        ico,
        modifier,
        updates,
      ) as Promise<{ success: boolean; changes: number }>,

    delete: (ico: string, modifier: number) =>
      ipcRenderer.invoke("db:contacts:delete", ico, modifier) as Promise<{
        success: boolean;
        changes: number;
      }>,
  },

  items: {
    getAll: () => ipcRenderer.invoke("db:items:getAll") as Promise<Item[]>,

    getOne: (id: number) =>
      ipcRenderer.invoke("db:items:getOne", id) as Promise<Item | undefined>,

    create: (item: CreateItemInput) =>
      ipcRenderer.invoke("db:items:create", item) as Promise<{
        success: boolean;
        id: number;
        changes: number;
      }>,

    update: (id: number, updates: Partial<Item>) =>
      ipcRenderer.invoke("db:items:update", id, updates) as Promise<{
        success: boolean;
        changes: number;
      }>,

    delete: (id: number) =>
      ipcRenderer.invoke("db:items:delete", id) as Promise<{
        success: boolean;
        changes: number;
      }>,
  },

  admin: {
    getDbStats: () => ipcRenderer.invoke("db:getStats"),
    clearDb: () => ipcRenderer.invoke("db:clearDatabase"),
    fillTestData: () => ipcRenderer.invoke("db:fillTestData"),
  },
});
