import { ipcMain, app } from "electron";
import { logger } from "../logger";
import fs from "fs";
import path from "path";
import { Worker } from "worker_threads";

// All import logic has been moved to import-worker.ts to run in a separate thread

// =============================================================================
// IPC HANDLER REGISTRATION
// =============================================================================

function registerDataImportHandlers() {
	ipcMain.handle("db:importData", async (event, directoryPath: string) => {
		try {
			if (!directoryPath) {
				return { success: false, error: "Nebyla vybrána složka" };
			}

			// Validate directory exists
			if (!fs.existsSync(directoryPath)) {
				return { success: false, error: "Vybraná složka neexistuje" };
			}

			logger.info(`Importing data from: ${directoryPath}`);

			// Get database path
			const userDataPath = app.getPath("userData");
			const dbPath = path.join(userDataPath, "krezbooks.db");

			// Spawn worker thread
			const workerPath = path.join(__dirname, "workers/import-worker.js");
			const worker = new Worker(workerPath, {
				workerData: { folderPath: directoryPath, dbPath },
			});

			// Send initial message
			event.sender.send("import:progress", {
				message: "Import zahájen",
				progress: 0,
			});

			// Listen for messages from worker
			worker.on("message", (msg) => {
				if (msg.type === "progress") {
					event.sender.send("import:progress", {
						message: msg.message,
						progress: msg.progress,
					});
				} else if (msg.type === "complete") {
					// Send statistics messages if import was successful
					if (msg.result.success && msg.result.imported) {
						const stats = msg.result.imported;
						const skipped = msg.result.skipped;

						// Send detailed statistics
						if (stats.contacts > 0 || skipped.contacts > 0) {
							event.sender.send("import:progress", {
								message: `Kontakty: ${stats.contacts} importováno, ${skipped.contacts} přeskočeno`,
								progress: 100,
							});
						}
						if (stats.items > 0 || skipped.items > 0) {
							event.sender.send("import:progress", {
								message: `Položky: ${stats.items} importováno, ${skipped.items} přeskočeno`,
								progress: 100,
							});
						}
						if (stats.invoices > 0 || skipped.invoices > 0) {
							event.sender.send("import:progress", {
								message: `Doklady: ${stats.invoices} importováno, ${skipped.invoices} přeskočeno`,
								progress: 100,
							});
						}
						if (stats.stock_movements > 0 || skipped.stock_movements > 0) {
							event.sender.send("import:progress", {
								message: `Pohyby skladu: ${stats.stock_movements} importováno, ${skipped.stock_movements} přeskočeno`,
								progress: 100,
							});
						}

						// Send log file path if errors occurred
						if (msg.result.logFile) {
							event.sender.send("import:progress", {
								message: `Chybový log: ${msg.result.logFile}`,
								progress: 100,
							});
						}
					}

					event.sender.send("import:complete", msg.result);
					worker.terminate();
				}
			});

			// Handle worker errors
			worker.on("error", (error) => {
				logger.error("Import worker error:", error);
				event.sender.send("import:complete", {
					success: false,
					error: error.message || "Import selhal",
				});
			});

			// Handle worker exit
			worker.on("exit", (code) => {
				if (code !== 0) {
					logger.error(`Worker stopped with exit code ${code}`);
				}
			});

			// Return immediately to indicate import has started
			return { success: true, started: true };
		} catch (error: any) {
			logger.error("Import failed:", error);
			event.sender.send("import:progress", {
				message: `Import selhal: ${error.message}`,
				progress: 0,
			});
			return {
				success: false,
				error: error.message || "Import selhal",
			};
		}
	});
}

export { registerDataImportHandlers };
