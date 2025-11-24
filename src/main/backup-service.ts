import { app } from "electron";
import { logger } from "./logger";
import { getDatabase } from "./database";
import { settingsQueries } from "./queries";
import fs from "fs";
import path from "path";

const TABLES = ["contacts", "items", "invoices", "stock_movements"] as const;
type TableName = (typeof TABLES)[number];

const UTF8_BOM = "\uFEFF";
const CSV_DELIMITER = ";";

function escapeCSVValue(value: unknown): string {
	if (value === null || value === undefined) {
		return "";
	}

	const stringValue = String(value);

	if (
		stringValue.includes(CSV_DELIMITER) ||
		stringValue.includes('"') ||
		stringValue.includes("\n") ||
		stringValue.includes("\r")
	) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}

	return stringValue;
}

function rowToCSV(row: Record<string, unknown>, columns: string[]): string {
	return columns.map((col) => escapeCSVValue(row[col])).join(CSV_DELIMITER);
}

function tableToCSV(rows: Record<string, unknown>[]): string {
	if (rows.length === 0) {
		return "";
	}

	const columns = Object.keys(rows[0]);
	const header = columns.join(CSV_DELIMITER);
	const dataRows = rows.map((row) => rowToCSV(row, columns));

	return UTF8_BOM + header + "\n" + dataRows.join("\n");
}

function exportTable(tableName: TableName): { csv: string; count: number } {
	const db = getDatabase();
	const rows = db.prepare(`SELECT * FROM ${tableName}`).all() as Record<
		string,
		unknown
	>[];

	return { csv: tableToCSV(rows), count: rows.length };
}

function formatTimestamp(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}-${hours}-${minutes}`;
}

/**
 * Get the configured backup path from settings, or use default
 */
function getBackupPath(): string {
	const db = getDatabase();

	try {
		const result = db
			.prepare(settingsQueries.get)
			.get("backup_path") as { value: string } | undefined;

		if (result?.value) {
			return result.value;
		}
	} catch (error) {
		logger.warn("Failed to get backup path from settings, using default:", error);
	}

	// Default location
	const userDataPath = app.getPath("userData");
	return path.join(userDataPath, "krezbooks-backups");
}

/**
 * Set the backup path in settings
 */
export function setBackupPath(backupPath: string): void {
	const db = getDatabase();
	db.prepare(settingsQueries.set).run("backup_path", backupPath);
	logger.info(`Backup path updated to: ${backupPath}`);
}

/**
 * Get the current backup path setting
 */
export function getBackupPathSetting(): string {
	return getBackupPath();
}

/**
 * Performs automatic backup to the configured location
 * Creates timestamped backup folder with CSV exports
 */
export async function performAutomaticBackup(): Promise<{
	success: boolean;
	error?: string;
	path?: string;
}> {
	try {
		const backupBasePath = getBackupPath();

		// Ensure backup base directory exists
		if (!fs.existsSync(backupBasePath)) {
			fs.mkdirSync(backupBasePath, { recursive: true });
		}

		const backupFolderName = `krezbooks-backup-${formatTimestamp(new Date())}`;
		const backupPath = path.join(backupBasePath, backupFolderName);

		// Create backup directory
		fs.mkdirSync(backupPath, { recursive: true });

		logger.info(`Starting automatic backup to: ${backupPath}`);

		// Export all tables
		for (const tableName of TABLES) {
			const { csv: csvContent, count } = exportTable(tableName);

			const filePath = path.join(backupPath, `${tableName}.csv`);
			fs.writeFileSync(filePath, csvContent, "utf-8");

			logger.info(`Backed up ${count} rows from ${tableName}`);
		}

		logger.info(`Automatic backup completed: ${backupPath}`);
		return { success: true, path: backupPath };
	} catch (error: any) {
		logger.error("Automatic backup failed:", error);
		return {
			success: false,
			error: error.message || "Backup selhal",
		};
	}
}

/**
 * Performs manual backup triggered by user from settings
 * Same as automatic backup but can be called from IPC handler
 */
export async function performManualBackup(): Promise<{
	success: boolean;
	error?: string;
	path?: string;
}> {
	logger.info("Manual backup triggered");
	return performAutomaticBackup();
}
