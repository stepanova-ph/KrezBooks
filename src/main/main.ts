import { app, BrowserWindow } from "electron";
import path from "path";
import { initDatabase, closeDatabase } from "./database";
import { registerIpcHandlers } from "./ipc-handlers";
import registerAdminHandlers from "./admin-handlers";
import { logger } from "./logger";
import { registerLegacyImportHandlers } from "./data-handlers/data-import-legacy-handlers";
import { registerDataExportHandlers } from "./data-handlers/data-export-handlers";
import { registerDataImportHandlers } from "./data-handlers/data-import-handlers";
import { registerDialogHandlers } from "./dialog-handlers";
import { registerBackupHandlers } from "./backup-handlers";
import { performAutomaticBackup } from "./backup-service";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
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

	mainWindow.webContents.openDevTools();

	if (process.env.VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
		// mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
	}

	mainWindow.on("closed", () => {
		mainWindow = null;
	});
}

app.whenReady().then(async () => {
	try {
		await initDatabase();
		logger.info("✓ Database ready");
	} catch (error) {
		logger.error("Database initialization failed:", error);
	}

	registerIpcHandlers();
	registerAdminHandlers();
	registerDataExportHandlers();
	registerLegacyImportHandlers();
	registerDataImportHandlers();
	registerDialogHandlers();
	registerBackupHandlers();

	createWindow();

	// Perform automatic backup on app startup
	logger.info("Performing automatic backup on app startup...");
	performAutomaticBackup()
		.then((result) => {
			if (result.success) {
				logger.info(`✓ Startup backup completed: ${result.path}`);
			} else {
				logger.error(`✗ Startup backup failed: ${result.error}`);
			}
		})
		.catch((error) => {
			logger.error("Startup backup error:", error);
		});
});

app.on("window-all-closed", () => {
	closeDatabase();
	app.quit();
});

app.on("before-quit", async (event) => {
	// Prevent default quit to allow backup to complete
	event.preventDefault();

	logger.info("Performing automatic backup on app exit...");
	try {
		const result = await performAutomaticBackup();
		if (result.success) {
			logger.info(`✓ Exit backup completed: ${result.path}`);
		} else {
			logger.error(`✗ Exit backup failed: ${result.error}`);
		}
	} catch (error) {
		logger.error("Exit backup error:", error);
	} finally {
		// Close database and quit for real
		closeDatabase();
		app.exit();
	}
});
