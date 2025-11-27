import { ipcMain, shell } from "electron";
import { handleIpcRequest } from "./ipcWrapper";
import { logger } from "./logger";

export function registerShellHandlers() {
	ipcMain.handle(
		"shell:openEmail",
		async (_event, email: string, subject: string, body: string) => {
			return handleIpcRequest(async () => {
				try {
					const params = new URLSearchParams();
					if (subject) params.append("subject", subject);
					if (body) params.append("body", body);

					const mailtoUrl = `mailto:${email}?${params.toString()}`;

					logger.info(`Opening mailto URL: ${mailtoUrl}`);

					const result = await shell.openExternal(mailtoUrl);

					logger.info(`shell.openExternal result: ${result}, email: ${email}`);

					return { opened: result };
				} catch (error) {
					logger.error("Failed to open email client:", error);
					throw error;
				}
			});
		},
	);

	logger.info("✓ Shell handlers registered");
}
