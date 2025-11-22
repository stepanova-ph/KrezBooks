import { app, BrowserWindow } from "electron";
import path from "path";
import { initDatabase, closeDatabase } from "./database";
import { registerIpcHandlers } from "./ipc-handlers";
import registerAdminHandlers from "./admin-handlers";
import { logger } from "./logger";
import { registerDataTransferHandlers } from "./data-transfer-handlers";

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
	registerDataTransferHandlers();

	createWindow();
});

app.on("window-all-closed", () => {
	closeDatabase();
	app.quit();
});

app.on("before-quit", () => {
	closeDatabase();
});
