import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";
import fs from "fs";
import { logger } from "./logger";
import {
	contactQueries,
	invoiceQueries,
	itemQueries,
	settingsQueries,
} from "./queries";
import { stockMovementQueries } from "./queries/stockMovements";

class DatabaseManager {
	private static instance: DatabaseManager;
	private db: Database.Database | null = null;

	private constructor() {}

	public static getInstance(): DatabaseManager {
		if (!DatabaseManager.instance) {
			DatabaseManager.instance = new DatabaseManager();
		}
		return DatabaseManager.instance;
	}

	private getDatabasePath(): string {
		const userDataPath = app.getPath("userData");

		if (!fs.existsSync(userDataPath)) {
			try {
				fs.mkdirSync(userDataPath, { recursive: true });
			} catch (error) {
				logger.error("Failed to create user data directory:", error);
				throw new Error(
					`Cannot create data directory: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}

		return path.join(userDataPath, "krezbooks.db");
	}

	private checkIntegrity(db: Database.Database): boolean {
		try {
			const result = db.pragma("integrity_check") as { integrity_check: string }[];
			return result.length === 1 && result[0].integrity_check === "ok";
		} catch {
			return false;
		}
	}

	public initDatabase(): Database.Database {
		try {
			if (this.db) return this.db;

			const dbPath = this.getDatabasePath();
			logger.log("Database path:", dbPath);

			try {
				this.db = new Database(dbPath);
			} catch (error) {
				logger.warn("Failed to open database, attempting recovery:", error);
				this.recoverCorruptDatabase(dbPath);
				this.db = new Database(dbPath);
			}

			if (!this.checkIntegrity(this.db)) {
				logger.warn("Database integrity check failed, attempting recovery");
				this.db.close();
				this.db = null;
				this.recoverCorruptDatabase(dbPath);
				this.db = new Database(dbPath);
			}

			try {
				this.db.pragma("foreign_keys = ON");
			} catch (error) {
				logger.error("Failed to enable foreign keys:", error);
				throw new Error(
					`Cannot configure database: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}

			this.createTables();

			logger.log("Database initialized successfully");
			return this.db;
		} catch (error) {
			logger.error("Failed to initialize database:", error);
			if (this.db) {
				try {
					this.db.close();
				} catch (closeError) {
					logger.error(
						"Failed to close database after init error:",
						closeError,
					);
				}
				this.db = null;
			}
			throw new Error(
				`Database initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	public getDatabase(): Database.Database {
		if (!this.db) {
			throw new Error("Database not initialized. Call initDatabase() first.");
		}
		return this.db;
	}

	public closeDatabase() {
		if (this.db) {
			try {
				this.db.close();
				this.db = null;
				logger.log("Database closed");
			} catch (error) {
				logger.error("Error closing database:", error);
				this.db = null;
			}
		}
	}

	private recoverCorruptDatabase(dbPath: string) {
		const corruptPath = `${dbPath}.corrupt-${Date.now()}`;
		try {
			if (fs.existsSync(dbPath)) {
				fs.renameSync(dbPath, corruptPath);
				logger.warn(`Corrupt database moved to: ${corruptPath}`);
			}
		} catch (error) {
			logger.error("Failed to move corrupt database:", error);
			throw new Error(
				`Database recovery failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	private createTables() {
		if (!this.db) throw new Error("Database not initialized");

		try {
			this.db.exec(contactQueries.createTable);
			logger.log("✓ Contacts table ready");

			this.db.exec(itemQueries.createTable);
			logger.log("✓ Items table ready");

			this.db.exec(invoiceQueries.createTable);
			logger.log("✓ Invoice table ready");

			this.db.exec(stockMovementQueries.createTable);
			logger.log("✓ Stock Movements table ready");

			this.db.exec(settingsQueries.createTable);
			logger.log("✓ Settings table ready");

			// Create indexes for performance optimization
			this.db.exec('CREATE INDEX IF NOT EXISTS idx_invoices_type_date ON invoices(type, date_issue)');
			this.db.exec('CREATE INDEX IF NOT EXISTS idx_stock_movements_reset ON stock_movements(item_ean, created_at, reset_point)');

			logger.log("✓ Indexes created");

			logger.log("Tables created successfully");
		} catch (error) {
			logger.error("Failed to create tables:", error);
			throw new Error(
				`Table creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}
}

export const initDatabase = () => DatabaseManager.getInstance().initDatabase();
export const getDatabase = () => DatabaseManager.getInstance().getDatabase();
export const closeDatabase = () =>
	DatabaseManager.getInstance().closeDatabase();
