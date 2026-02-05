import { ipcMain, shell } from "electron";
import { handleIpcRequest } from "./ipcWrapper";
import { logger } from "./logger";

export function registerShellHandlers() {
	ipcMain.handle(
		"shell:openEmail",
		async (_event, email: string, subject: string, body: string, attachmentPath?: string) => {
			return handleIpcRequest(async () => {
				try {
					// Build query params manually using encodeURIComponent to encode spaces as %20
					const params: string[] = [];
					if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
					if (body) params.push(`body=${encodeURIComponent(body)}`);

					const mailtoUrl = `mailto:${email}${params.length > 0 ? '?' + params.join('&') : ''}`;

					logger.info(`Opening mailto URL: ${mailtoUrl}`);

					// Open the email client
					await shell.openExternal(mailtoUrl);

					// If there's a PDF, also open it in Finder/Explorer so user can easily attach it
					if (attachmentPath) {
						shell.showItemInFolder(attachmentPath);
						logger.info(`Opened PDF location: ${attachmentPath}`);
					}

					// shell.openExternal returns void on macOS, so if we reach here without error, it succeeded
					logger.info(`Email client opened successfully. Email: ${email}, PDF: ${attachmentPath || 'none'}`);

					return { opened: true, pdfPath: attachmentPath };
				} catch (error) {
					logger.error("Failed to open email client:", error);
					throw error;
				}
			});
		},
	);

	logger.info("✓ Shell handlers registered");
}
