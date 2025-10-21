import { contextBridge, ipcRenderer } from "electron";
import type {
  Contact,
  Item,
  CreateContactInput,
  CreateItemInput,
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
    getAll: () => ipcRenderer.invoke("db:contacts:getAll"),
    getOne: (ico: string, modifier: number) =>
      ipcRenderer.invoke("db:contacts:getOne", ico, modifier),
    getCategories: () => ipcRenderer.invoke("db:items:getCategories"),
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
  },
});