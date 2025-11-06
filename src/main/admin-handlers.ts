import { ipcMain } from "electron";
import { getDatabase } from "./database";
import { logger } from "./logger";
import {
	contactQueries,
	invoiceQueries,
	itemQueries,
	stockMovementQueries,
} from "./queries";
import { fillTestData } from "../utils/example/fillDatabase";

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

			const stockMovementCount = db
				.prepare("SELECT COUNT(*) as count FROM stock_movements")
				.get() as { count: number };
			const invoiceCount = db
				.prepare("SELECT COUNT(*) as count FROM invoices")
				.get() as { count: number };

			return {
				success: true,
				data: {
					contacts: contactCount.count,
					items: itemCount.count,
					stockMovements: stockMovementCount.count,
					invoices: invoiceCount.count,
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

	ipcMain.handle("db:clearDatabase", async () => {
		try {
			const db = getDatabase();

			db.prepare("DELETE FROM items").run();
			db.prepare("DELETE FROM contacts").run();
			db.prepare("DELETE FROM stock_movements").run();
			db.prepare("DELETE FROM invoices").run();

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

	ipcMain.handle("db:recreateTables", async () => {
		try {
			const db = getDatabase();

			// Drop all tables
			db.prepare("DROP TABLE IF EXISTS stock_movements").run();
			db.prepare("DROP TABLE IF EXISTS invoices").run();
			db.prepare("DROP TABLE IF EXISTS items").run();
			db.prepare("DROP TABLE IF EXISTS contacts").run();
			db.prepare("DROP TABLE IF EXISTS invoices").run();
			db.prepare("DROP TABLE IF EXISTS stockMovements").run();

			// Recreate tables by calling createTables from database.ts
			// We need to expose this method
			db.exec(contactQueries.createTable);
			db.exec(itemQueries.createTable);
			db.exec(stockMovementQueries.createTable);
			db.exec(invoiceQueries.createTable);

			logger.info("Tables recreated successfully");
			return { success: true };
		} catch (error: any) {
			logger.error("Error recreating tables:", error);
			return {
				success: false,
				error: error.message || "Failed to recreate tables",
			};
		}
	});

	ipcMain.handle("db:fillTestData", async () => {
		try {
			const db = getDatabase();

			const { contactsAdded, itemsAdded, invoicesAdded, stockMovementsAdded, errors } = fillTestData(db);
	// 		let contactsAdded = 0;
	// 		let itemsAdded = 0;
	// 		let errors: string[] = [];

	// 		const insertContact = db.prepare(`
    //     INSERT INTO contacts (
    //       ico, modifier, dic, company_name, representative_name,
    //       street, city, postal_code, phone, email, website,
    //       bank_account, is_supplier, is_customer, price_group
    //     ) VALUES (
    //       @ico, @modifier, @dic, @company_name, @representative_name,
    //       @street, @city, @postal_code, @phone, @email, @website,
    //       @bank_account, @is_supplier, @is_customer, @price_group
    //     )
    //   `);

	// 		for (const contact of testContacts) {
	// 			try {
	// 				insertContact.run({
	// 					ico: contact.ico,
	// 					modifier: contact.modifier,
	// 					dic: contact.dic || null,
	// 					company_name: contact.company_name,
	// 					representative_name: contact.representative_name || null,
	// 					street: contact.street || null,
	// 					city: contact.city || null,
	// 					postal_code: contact.postal_code || null,
	// 					phone: contact.phone || null,
	// 					email: contact.email || null,
	// 					website: contact.website || null,
	// 					bank_account: contact.bank_account || null,
	// 					is_supplier: contact.is_supplier ? 1 : 0,
	// 					is_customer: contact.is_customer ? 1 : 0,
	// 					price_group: contact.price_group,
	// 				});
	// 				contactsAdded++;
	// 			} catch (error: any) {
	// 				errors.push(`Contact ${contact.company_name}: ${error.message}`);
	// 				logger.error(
	// 					`Error inserting contact ${contact.company_name}:`,
	// 					error,
	// 				);
	// 			}
	// 		}

	// 		const insertItem = db.prepare(`
    //     INSERT INTO items (
    //       ean, name, category, note, vat_rate, unit_of_measure,
    //       sale_price_group1, sale_price_group2, sale_price_group3, sale_price_group4
    //     ) VALUES (
    //       @ean, @name, @category, @note, @vat_rate, @unit_of_measure,
    //       @sale_price_group1, @sale_price_group2, @sale_price_group3, @sale_price_group4
    //     )
    //   `);

	// 		for (const item of testItems) {
	// 			try {
	// 				insertItem.run({
	// 					ean: item.ean,
	// 					name: item.name,
	// 					category: item.category || null,
	// 					note: item.note || null,
	// 					vat_rate: item.vat_rate,
	// 					unit_of_measure: item.unit_of_measure,
	// 					sale_price_group1: item.sale_price_group1,
	// 					sale_price_group2: item.sale_price_group2,
	// 					sale_price_group3: item.sale_price_group3,
	// 					sale_price_group4: item.sale_price_group4,
	// 				});
	// 				itemsAdded++;
	// 			} catch (error: any) {
	// 				errors.push(`Item ${item.name}: ${error.message}`);
	// 				logger.error(`Error inserting item ${item.name}:`, error);
	// 			}
	// 		}

			logger.info(
				`Test data inserted: ${contactsAdded} contacts, ${itemsAdded} items, ${invoicesAdded} invoices with ${stockMovementsAdded} stock movements`,
			);
			if (errors.length > 0) {
				logger.warn("Some items failed to insert:", errors);
			}

			return {
				success: true,
				data: {
					contactsAdded,
					itemsAdded,
					invoicesAdded,
					stockMovementsAdded,
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
