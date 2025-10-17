import { ipcMain } from "electron";
import { getDatabase } from "./database";
import { testContacts, testItems } from "../utils/testUtils";
import { logger } from "./logger";

function registerAdminHandlers() {
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
      logger.error("Error getting database stats:", error);
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

      logger.info("Database cleared successfully");
      return { success: true };
    } catch (error: any) {
      logger.error("Error clearing database:", error);
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
          logger.error(
            `Error inserting contact ${contact.company_name}:`,
            error,
          );
        }
      }

      // Insert items
      const insertItem = db.prepare(`
        INSERT INTO items (
          ean, name, category, note, vat_rate,
          avg_purchase_price, last_purchase_price, unit_of_measure,
          sale_price_group1, sale_price_group2, sale_price_group3, sale_price_group4
        ) VALUES (
          @ean, @name, @category, @note, @vat_rate,
          @avg_purchase_price, @last_purchase_price, @unit_of_measure,
          @sale_price_group1, @sale_price_group2, @sale_price_group3, @sale_price_group4
        )
      `);

      for (const item of testItems) {
        try {
          insertItem.run({
            ean: item.ean,
            name: item.name,
            category: item.category || null,
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
          logger.error(`Error inserting item ${item.name}:`, error);
        }
      }

      logger.info(
        `Test data inserted: ${contactsAdded} contacts, ${itemsAdded} items`,
      );
      if (errors.length > 0) {
        logger.warn("Some items failed to insert:", errors);
      }

      return {
        success: true,
        data: {
          contactsAdded,
          itemsAdded,
        },
      };
    } catch (error: any) {
      logger.error("Error filling test data:", error);
      return {
        success: false,
        error: error.message || "Failed to fill test data",
      };
    }
  });

  logger.info("✓ Admin IPC handlers registered");
}

export default registerAdminHandlers;