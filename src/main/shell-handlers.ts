import { ipcMain, shell, app } from "electron";
import { handleIpcRequest } from "./ipcWrapper";
import { logger } from "./logger";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execFileAsync = promisify(execFile);

async function createOutlookDraft(
	email: string,
	subject: string,
	body: string,
	attachmentPath?: string,
): Promise<void> {
	const resourcesPath = process.env.NODE_ENV === 'development'
		? path.join(app.getAppPath(), 'resources')
		: process.resourcesPath;

	const scriptPath = path.join(resourcesPath, 'create-outlook-draft.ps1');

	if (!fs.existsSync(scriptPath)) {
		throw new Error(`PowerShell script not found: ${scriptPath}`);
	}

	const args = [
		"-ExecutionPolicy", "Bypass",
		"-File", scriptPath,
		"-to", email,
		"-subject", subject,
		"-body", body,
		"-attachmentPath", attachmentPath || "",
	];

	logger.info(`Executing PowerShell command to create Outlook draft`);

	const { stdout, stderr } = await execFileAsync("powershell.exe", args);

	if (stderr && !stderr.includes('WARNING')) {
		logger.warn(`PowerShell stderr: ${stderr}`);
	}

	logger.info(`PowerShell stdout: ${stdout}`);
}

async function createMailDraft(
	email: string,
	subject: string,
	body: string,
	attachmentPath?: string,
): Promise<void> {
	const resourcesPath = process.env.NODE_ENV === 'development'
		? path.join(app.getAppPath(), 'resources')
		: process.resourcesPath;

	const scriptPath = path.join(resourcesPath, 'create-mail-draft.applescript');

	if (!fs.existsSync(scriptPath)) {
		throw new Error(`AppleScript not found: ${scriptPath}`);
	}

	const args = [
		scriptPath,
		email,
		subject,
		body,
		attachmentPath || "",
	];

	logger.info(`Executing AppleScript command to create Mail draft`);

	const { stdout, stderr } = await execFileAsync("osascript", args);

	if (stderr) {
		logger.warn(`AppleScript stderr: ${stderr}`);
	}

	logger.info(`AppleScript stdout: ${stdout}`);
}

async function createEmailWithFallback(
	email: string,
	subject: string,
	body: string,
	attachmentPath?: string,
): Promise<void> {
	// Fallback to mailto: for Linux or when scripts fail
	const params: string[] = [];
	if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
	if (body) params.push(`body=${encodeURIComponent(body)}`);

	const mailtoUrl = `mailto:${email}${params.length > 0 ? '?' + params.join('&') : ''}`;

	logger.info(`Opening mailto URL (fallback): ${mailtoUrl}`);

	await shell.openExternal(mailtoUrl);

	// If there's a PDF, open it in file manager so user can manually attach it
	if (attachmentPath) {
		shell.showItemInFolder(attachmentPath);
		logger.info(`Opened PDF location: ${attachmentPath}`);
	}
}

export function registerShellHandlers() {
	ipcMain.handle(
		"shell:openEmail",
		async (_event, email: string, subject: string, body: string, attachmentPath?: string) => {
			return handleIpcRequest(async () => {
				try {
					const platform = process.platform;

					logger.info(`Creating email draft for platform: ${platform}, attachment: ${attachmentPath || 'none'}`);

					if (platform === 'win32' && attachmentPath) {
						// Windows + Outlook - Use PowerShell COM automation
						try {
							await createOutlookDraft(email, subject, body, attachmentPath);
							logger.info(`Outlook draft created successfully`);
							return { opened: true, pdfPath: attachmentPath };
						} catch (error) {
							logger.error(`Failed to create Outlook draft, falling back to mailto:`, error);
							await createEmailWithFallback(email, subject, body, attachmentPath);
							return { opened: true, pdfPath: attachmentPath };
						}
					} else if (platform === 'darwin' && attachmentPath) {
						// macOS + Apple Mail - Use AppleScript
						try {
							await createMailDraft(email, subject, body, attachmentPath);
							logger.info(`Mail draft created successfully`);
							return { opened: true, pdfPath: attachmentPath };
						} catch (error) {
							logger.error(`Failed to create Mail draft, falling back to mailto:`, error);
							await createEmailWithFallback(email, subject, body, attachmentPath);
							return { opened: true, pdfPath: attachmentPath };
						}
					} else {
						// Linux or no attachment - Use mailto: fallback
						await createEmailWithFallback(email, subject, body, attachmentPath);
						return { opened: true, pdfPath: attachmentPath };
					}
				} catch (error) {
					logger.error("Failed to open email client:", error);
					throw error;
				}
			});
		},
	);

	logger.info("✓ Shell handlers registered");
}
