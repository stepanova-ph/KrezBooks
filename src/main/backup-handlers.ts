import { ipcMain } from "electron";
import {
	performManualBackup,
	getBackupPathSetting,
	setBackupPath,
} from "./backup-service";
import { logger } from "./logger";

function registerBackupHandlers() {
	// Get current backup path setting
	ipcMain.handle("backup:getPath", async () => {
		try {
			const backupPath = getBackupPathSetting();
			return { success: true, path: backupPath };
		} catch (error: any) {
			logger.error("Failed to get backup path:", error);
			return {
				success: false,
				error: error.message || "Nepodařilo se získat cestu k zálohám",
			};
		}
	});

	// Set backup path setting
	ipcMain.handle("backup:setPath", async (event, backupPath: string) => {
		try {
			setBackupPath(backupPath);
			return { success: true };
		} catch (error: any) {
			logger.error("Failed to set backup path:", error);
			return {
				success: false,
				error: error.message || "Nepodařilo se nastavit cestu k zálohám",
			};
		}
	});

	// Perform manual backup
	ipcMain.handle("backup:create", async () => {
		try {
			const result = await performManualBackup();
			return result;
		} catch (error: any) {
			logger.error("Manual backup failed:", error);
			return {
				success: false,
				error: error.message || "Záloha selhala",
			};
		}
	});
}

export { registerBackupHandlers };
