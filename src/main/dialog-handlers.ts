import { ipcMain, dialog, BrowserWindow } from "electron";
import { logger } from "./logger";

function registerDialogHandlers() {
	ipcMain.handle("dialog:selectDirectory", async (event, title?: string) => {
		try {
			const window = BrowserWindow.fromWebContents(event.sender);

			const result = await dialog.showOpenDialog(window!, {
				title: title || "Vyberte složku",
				properties: ["openDirectory", "createDirectory"],
				buttonLabel: "Vybrat",
			});

			if (result.canceled || result.filePaths.length === 0) {
				return { success: false, canceled: true };
			}

			return { success: true, path: result.filePaths[0] };
		} catch (error: any) {
			logger.error("Directory selection failed:", error);
			return {
				success: false,
				error: error.message || "Výběr složky selhal",
			};
		}
	});

	ipcMain.handle(
		"dialog:saveFile",
		async (event, defaultFilename?: string, title?: string) => {
			try {
				const window = BrowserWindow.fromWebContents(event.sender);

				const result = await dialog.showSaveDialog(window!, {
					title: title || "Uložit soubor",
					defaultPath: defaultFilename,
					buttonLabel: "Uložit",
					filters: [
						{ name: "PDF soubory", extensions: ["pdf"] },
						{ name: "Všechny soubory", extensions: ["*"] },
					],
				});

				if (result.canceled || !result.filePath) {
					return { success: false, canceled: true };
				}

				return { success: true, path: result.filePath };
			} catch (error: any) {
				logger.error("Save file dialog failed:", error);
				return {
					success: false,
					error: error.message || "Výběr umístění souboru selhal",
				};
			}
		},
	);
}

export { registerDialogHandlers };
