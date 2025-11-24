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

			db.prepare("DELETE FROM stock_movements").run();
			db.prepare("DELETE FROM invoices").run();
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

	ipcMain.handle("db:recreateTables", async () => {
		try {
			const db = getDatabase();

			db.prepare("DROP TABLE IF EXISTS stock_movements").run();
			db.prepare("DROP TABLE IF EXISTS invoices").run();
			db.prepare("DROP TABLE IF EXISTS items").run();
			db.prepare("DROP TABLE IF EXISTS contacts").run();
			db.prepare("DROP TABLE IF EXISTS invoices").run();
			db.prepare("DROP TABLE IF EXISTS stockMovements").run();

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

			const {
				contactsAdded,
				itemsAdded,
				invoicesAdded,
				stockMovementsAdded,
				errors,
			} = fillTestData(db);

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
