import { ipcMain, dialog, BrowserWindow } from "electron";
import { getDatabase } from "../database";
import { logger } from "../logger";
import fs from "fs";
import path from "path";

const TABLES = ["contacts", "items", "invoices", "stock_movements"] as const;
type TableName = (typeof TABLES)[number];

// UTF-8 BOM for Excel to recognize encoding
const UTF8_BOM = "\uFEFF";
const CSV_DELIMITER = ";";

function escapeCSVValue(value: unknown): string {
	if (value === null || value === undefined) {
		return "";
	}

	const stringValue = String(value);

	// Escape if contains delimiter, quotes, or newlines
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

function exportTable(tableName: TableName): string {
	const db = getDatabase();
	const rows = db.prepare(`SELECT * FROM ${tableName}`).all() as Record<
		string,
		unknown
	>[];

	return tableToCSV(rows);
}

function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

async function performExport(
	exportPath: string,
): Promise<{ success: boolean; error?: string; path?: string }> {
	const createdFiles: string[] = [];

	try {
		for (const tableName of TABLES) {
			const csvContent = exportTable(tableName);
			const filePath = path.join(exportPath, `${tableName}.csv`);

			fs.writeFileSync(filePath, csvContent, "utf-8");
			createdFiles.push(filePath);

			logger.info(`Exported ${tableName} to ${filePath}`);
		}

		logger.info(`Export completed to ${exportPath}`);
		return { success: true, path: exportPath };
	} catch (error: any) {
		// Cleanup on failure
		logger.error("Export failed, cleaning up:", error);

		for (const file of createdFiles) {
			try {
				if (fs.existsSync(file)) {
					fs.unlinkSync(file);
				}
			} catch (cleanupError) {
				logger.error(`Failed to cleanup ${file}:`, cleanupError);
			}
		}

		// Remove the export directory if empty
		try {
			if (fs.existsSync(exportPath)) {
				const remaining = fs.readdirSync(exportPath);
				if (remaining.length === 0) {
					fs.rmdirSync(exportPath);
				}
			}
		} catch (cleanupError) {
			logger.error("Failed to cleanup export directory:", cleanupError);
		}

		throw error;
	}
}

function registerDataExportHandlers() {
	ipcMain.handle("db:exportData", async (event) => {
		try {
			const window = BrowserWindow.fromWebContents(event.sender);

			const result = await dialog.showOpenDialog(window!, {
				title: "Vyberte složku pro export",
				properties: ["openDirectory", "createDirectory"],
				buttonLabel: "Exportovat sem",
			});

			if (result.canceled || result.filePaths.length === 0) {
				return { success: false, canceled: true };
			}

			const basePath = result.filePaths[0];
			const exportFolderName = `krezbooks-export-${formatDate(new Date())}`;
			const exportPath = path.join(basePath, exportFolderName);

			// Create export directory
			if (fs.existsSync(exportPath)) {
				// Add timestamp if folder already exists
				const timestamp = Date.now();
				const uniqueExportPath = path.join(
					basePath,
					`${exportFolderName}-${timestamp}`,
				);
				fs.mkdirSync(uniqueExportPath, { recursive: true });
				return await performExport(uniqueExportPath);
			}

			fs.mkdirSync(exportPath, { recursive: true });
			return await performExport(exportPath);
		} catch (error: any) {
			logger.error("Export failed:", error);
			return {
				success: false,
				error: error.message || "Export selhal",
			};
		}
	});
}

export { registerDataExportHandlers };