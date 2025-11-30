import { app, BrowserWindow, globalShortcut } from "electron";
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
import { registerPrintHandlers } from "./print-handlers";
import { registerShellHandlers } from "./shell-handlers";

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

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

	if (process.env.VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
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
	registerPrintHandlers();
	registerShellHandlers();

	createWindow();

	// Register Q to toggle DevTools
	globalShortcut.register("Q", () => {
		if (mainWindow && mainWindow.webContents) {
			mainWindow.webContents.toggleDevTools();
			logger.info("DevTools toggled via Q");
		}
	});

	logger.info("✓ Global shortcuts registered");
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("before-quit", async (event) => {
	if (isQuitting) {
		return;
	}

	event.preventDefault();
	isQuitting = true;

	// Unregister global shortcuts
	globalShortcut.unregisterAll();

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
		closeDatabase();
		app.exit();
	}
});
