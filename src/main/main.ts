// Electron's main process - runs in Node.js
// This creates the window and handles OS-level operations

import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { initDatabase, closeDatabase, getDatabase } from "./database";
import { registerIpcHandlers } from "./ipc-handlers";
import { testContacts, testItems } from "../utils/testUtils";

// Keep a global reference to prevent garbage collection
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    transparent: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js"),
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * Register admin database IPC handlers
 */
function registerAdminHandlers() {
  // Get database statistics
  ipcMain.handle("db:getStats", async () => {
    try {
      const db = getDatabase();

      const contactCount = db
        .prepare("SELECT COUNT(*) as count FROM contacts")
        .get() as { count: number };
      const itemCount = db
        .prepare("SELECT COUNT(*) as count FROM items")
        .get() as { count: number };

      return {
        success: true,
        data: {
          contacts: contactCount.count,
          items: itemCount.count,
        },
      };
    } catch (error: any) {
      console.error("Error getting database stats:", error);
      return {
        success: false,
        error: error.message || "Failed to get database statistics",
      };
    }
  });

  // Clear all data from database (but keep tables)
  ipcMain.handle("db:clearDatabase", async () => {
    try {
      const db = getDatabase();

      // Delete all data from tables
      db.prepare("DELETE FROM items").run();
      db.prepare("DELETE FROM contacts").run();

      console.log("Database cleared successfully");
      return { success: true };
    } catch (error: any) {
      console.error("Error clearing database:", error);
      return {
        success: false,
        error: error.message || "Failed to clear database",
      };
    }
  });

  // Fill database with test data
  ipcMain.handle("db:fillTestData", async () => {
    try {
      const db = getDatabase();

      let contactsAdded = 0;
      let itemsAdded = 0;
      let errors: string[] = [];

      // Insert contacts
      const insertContact = db.prepare(`
        INSERT INTO contacts (
          ico, modifier, dic, company_name, representative_name,
          street, city, postal_code, phone, email, website,
          bank_account, is_supplier, is_customer, price_group
        ) VALUES (
          @ico, @modifier, @dic, @company_name, @representative_name,
          @street, @city, @postal_code, @phone, @email, @website,
          @bank_account, @is_supplier, @is_customer, @price_group
        )
      `);

      for (const contact of testContacts) {
        try {
          insertContact.run({
            ico: contact.ico,
            modifier: contact.modifier,
            dic: contact.dic || null,
            company_name: contact.company_name,
            representative_name: contact.representative_name || null,
            street: contact.street || null,
            city: contact.city || null,
            postal_code: contact.postal_code || null,
            phone: contact.phone || null,
            email: contact.email || null,
            website: contact.website || null,
            bank_account: contact.bank_account || null,
            is_supplier: contact.is_supplier ? 1 : 0,
            is_customer: contact.is_customer ? 1 : 0,
            price_group: contact.price_group,
          });
          contactsAdded++;
        } catch (error: any) {
          errors.push(`Contact ${contact.company_name}: ${error.message}`);
          console.error(
            `Error inserting contact ${contact.company_name}:`,
            error,
          );
        }
      }

      // Insert items
      const insertItem = db.prepare(`
        INSERT INTO items (
          name, sales_group, note, vat_rate,
          avg_purchase_price, last_purchase_price, unit_of_measure,
          sale_price_group1, sale_price_group2, sale_price_group3, sale_price_group4
        ) VALUES (
          @name, @sales_group, @note, @vat_rate,
          @avg_purchase_price, @last_purchase_price, @unit_of_measure,
          @sale_price_group1, @sale_price_group2, @sale_price_group3, @sale_price_group4
        )
      `);

      for (const item of testItems) {
        try {
          insertItem.run({
            name: item.name,
            sales_group: item.sales_group || null,
            note: item.note || null,
            vat_rate: item.vat_rate,
            avg_purchase_price: item.avg_purchase_price,
            last_purchase_price: item.last_purchase_price,
            unit_of_measure: item.unit_of_measure,
            sale_price_group1: item.sale_price_group1,
            sale_price_group2: item.sale_price_group2,
            sale_price_group3: item.sale_price_group3,
            sale_price_group4: item.sale_price_group4,
          });
          itemsAdded++;
        } catch (error: any) {
          errors.push(`Item ${item.name}: ${error.message}`);
          console.error(`Error inserting item ${item.name}:`, error);
        }
      }

      console.log(
        `Test data inserted: ${contactsAdded} contacts, ${itemsAdded} items`,
      );
      if (errors.length > 0) {
        console.warn("Some items failed to insert:", errors);
      }

      return {
        success: true,
        data: {
          contactsAdded,
          itemsAdded,
        },
      };
    } catch (error: any) {
      console.error("Error filling test data:", error);
      return {
        success: false,
        error: error.message || "Failed to fill test data",
      };
    }
  });

  console.log("✓ Admin IPC handlers registered");
}

app.whenReady().then(() => {
  try {
    initDatabase();
    console.log("✓ Database ready");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }

  registerIpcHandlers();
  registerAdminHandlers();

  createWindow();
});

app.on("window-all-closed", () => {
  closeDatabase();
  app.quit();
});

app.on("before-quit", () => {
  closeDatabase();
});
