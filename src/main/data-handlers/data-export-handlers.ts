import { ipcMain } from "electron";
import { getDatabase } from "../database";
import { logger } from "../logger";
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

function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

async function performExport(
	exportPath: string,
	progressCallback?: (message: string, progress: number) => void,
): Promise<{
	success: boolean;
	error?: string;
	path?: string;
	exported?: Record<string, number>;
}> {
	const createdFiles: string[] = [];
	const exported: Record<string, number> = {
		contacts: 0,
		items: 0,
		invoices: 0,
		stock_movements: 0,
	};

	try {
		const totalTables = TABLES.length;

		for (let i = 0; i < TABLES.length; i++) {
			const tableName = TABLES[i];
			const progress = Math.round(((i + 1) / totalTables) * 100);

			progressCallback?.(`Exportuji tabulku ${tableName}...`, progress);

			const { csv: csvContent, count } = exportTable(tableName);
			exported[tableName] = count;

			const filePath = path.join(exportPath, `${tableName}.csv`);

			fs.writeFileSync(filePath, csvContent, "utf-8");
			createdFiles.push(filePath);

			logger.info(`Exported ${tableName} to ${filePath}`);
		}

		progressCallback?.(`Export dokončen`, 100);
		logger.info(`Export completed to ${exportPath}`);
		return { success: true, path: exportPath, exported };
	} catch (error: any) {
		progressCallback?.(`Export selhal: ${error.message}`, 0);
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
	ipcMain.handle("db:exportData", async (event, directoryPath: string) => {
		try {
			if (!directoryPath) {
				return { success: false, error: "Nebyla vybrána složka" };
			}

			if (!fs.existsSync(directoryPath)) {
				return { success: false, error: "Vybraná složka neexistuje" };
			}

			const exportFolderName = `krezbooks-export-${formatDate(new Date())}`;
			const exportPath = path.join(directoryPath, exportFolderName);

			let finalExportPath = exportPath;
			if (fs.existsSync(exportPath)) {
				const timestamp = Date.now();
				finalExportPath = path.join(
					directoryPath,
					`${exportFolderName}-${timestamp}`,
				);
			}

			fs.mkdirSync(finalExportPath, { recursive: true });

			const progressCallback = (message: string, progress: number) => {
				event.sender.send("export:progress", { message, progress });
			};

			event.sender.send("export:progress", {
				message: "Export zahájen",
				progress: 0,
			});

			performExport(finalExportPath, progressCallback)
				.then((result) => {
					if (result.success && result.exported) {
						const stats = result.exported;

						if (stats.contacts > 0) {
							event.sender.send("export:progress", {
								message: `Kontakty: ${stats.contacts} exportováno`,
								progress: 100,
							});
						}
						if (stats.items > 0) {
							event.sender.send("export:progress", {
								message: `Položky: ${stats.items} exportováno`,
								progress: 100,
							});
						}
						if (stats.invoices > 0) {
							event.sender.send("export:progress", {
								message: `Doklady: ${stats.invoices} exportováno`,
								progress: 100,
							});
						}
						if (stats.stock_movements > 0) {
							event.sender.send("export:progress", {
								message: `Pohyby skladu: ${stats.stock_movements} exportováno`,
								progress: 100,
							});
						}

						if (result.path) {
							event.sender.send("export:progress", {
								message: `Exportováno do: ${result.path}`,
								progress: 100,
							});
						}
					}

					event.sender.send("export:complete", result);
				})
				.catch((error) => {
					event.sender.send("export:complete", {
						success: false,
						error: error.message || "Export selhal",
					});
				});

			return { success: true, started: true };
		} catch (error: any) {
			logger.error("Export failed:", error);
			event.sender.send("export:progress", {
				message: `Export selhal: ${error.message}`,
				progress: 0,
			});
			return {
				success: false,
				error: error.message || "Export selhal",
			};
		}
	});
}

export { registerDataExportHandlers };
