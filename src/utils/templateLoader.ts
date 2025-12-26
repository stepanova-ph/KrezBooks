import * as fs from "fs";
import * as path from "path";

// Cache for loaded templates to avoid repeated file reads
const templateCache = new Map<string, string>();

/**
 * Load a template file from the templates directory
 * @param templatePath - Path relative to src/templates/ (e.g., 'invoice/invoice.html')
 * @returns Template content as string
 */
export function loadTemplate(templatePath: string): string {
	const cacheKey = `template:${templatePath}`;

	if (templateCache.has(cacheKey)) {
		return templateCache.get(cacheKey)!;
	}

	try {
		// In development: resolve from src/templates
		// In production: resolve from built dist directory
		const templateFile = path.join(__dirname, "../templates", templatePath);
		const content = fs.readFileSync(templateFile, "utf-8");

		templateCache.set(cacheKey, content);
		return content;
	} catch (error) {
		throw new Error(
			`Failed to load template '${templatePath}': ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Load a CSS file from the templates directory
 * @param cssPath - Path relative to src/templates/ (e.g., 'invoice/invoice.css')
 * @returns CSS content as string
 */
export function loadStyles(cssPath: string): string {
	const cacheKey = `styles:${cssPath}`;

	if (templateCache.has(cacheKey)) {
		return templateCache.get(cacheKey)!;
	}

	try {
		const cssFile = path.join(__dirname, "../templates", cssPath);
		const content = fs.readFileSync(cssFile, "utf-8");

		templateCache.set(cacheKey, content);
		return content;
	} catch (error) {
		throw new Error(
			`Failed to load styles '${cssPath}': ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Clear the template cache (useful for development/testing)
 */
export function clearTemplateCache(): void {
	templateCache.clear();
}
