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

			// Listen for messages from worker
			worker.on("message", (msg) => {
				if (msg.type === "progress") {
					event.sender.send("import:progress", {
						message: msg.message,
						progress: msg.progress,
					});
				} else if (msg.type === "complete") {
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
