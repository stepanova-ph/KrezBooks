/**
 * Core validation and normalization utilities
 * Used by both forms and filters
 */

/**
 * Validate Czech IČO (8-digit business ID with checksum)
 *
 * Algorithm:
 * 1. Multiply first 7 digits by weights [8,7,6,5,4,3,2]
 * 2. Sum the products
 * 3. Calculate: remainder = sum % 11
 * 4. Calculate checksum:
 *    - If remainder = 0, checksum = 1
 *    - If remainder = 1, checksum = 0
 *    - Otherwise, checksum = 11 - remainder
 * 5. Compare checksum with 8th digit
 *
 * Valid examples: '25596641', '12345678'
 * Invalid examples: '12345679' (wrong checksum), '1234567' (too short)
 *
 * Reference: https://www.abclinuxu.cz/blog/programovani/2008/9/overeni-ic
 */
export function validateICO(ico: string): boolean {
	if (!/^[0-9]{8}$/.test(ico)) return false;

	const weights = [8, 7, 6, 5, 4, 3, 2];
	let sum = 0;
	for (let i = 0; i < 7; i++) {
		sum += parseInt(ico[i], 10) * weights[i];
	}

	const mod = sum % 11;
	const check = mod === 0 ? 1 : mod === 1 ? 0 : 11 - mod;

	return check === parseInt(ico[7], 10);
}

/**
 * Validate DIČ (VAT ID) format
 * @param dic - The full DIČ including country code
 * @param ico - Optional IČO for cross-validation
 */
export function validateDIC(dic: string, ico?: string): boolean {
	if (!dic || dic.trim() === "") return true;
	if (!dic.startsWith("CZ")) return false;

	const digits = dic.slice(2);
	if (!/^[0-9]{8,10}$/.test(digits)) return false;

	if (digits.length === 8 && ico && digits !== ico) return false;

	return true;
}

/**
 * Validate Czech postal code (PSČ)
 * Accepts formats: "12345" or "123 45"
 */
export function validatePSC(psc: string): boolean {
	const digits = psc.replace(/\D/g, "");
	return digits.length === 5 && /^\d{5}$/.test(digits);
}

/**
 * Normalize PSČ to standard format "123 45"
 */
export function normalizePSC(psc: string): string {
	if (!psc || psc.trim() === "") return "";

	return psc.replace(/\D/g, "");
}

/**
 * Validate Czech phone number
 * Accepts formats with or without +420 prefix
 */
export function validatePhone(phone: string): boolean {
	const cleaned = phone.replace(/\s+/g, "");
	return /^(\+420)?[1-9][0-9]{8}$/.test(cleaned);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
	return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/**
 * Validate website URL format
 */
export function validateWebsite(url: string): boolean {
	if (!url || url.trim() === "") return true;

	let testUrl = url.trim();

	if (/^[a-z]+:\/\//i.test(testUrl)) {
		if (!/^https?:\/\//i.test(testUrl)) {
			return false;
		}
	} else {
		testUrl = "https://" + testUrl;
	}

	const domainPattern =
		/^https?:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/;
	return domainPattern.test(testUrl);
}

/**
 * Normalize website URL by removing protocol and trailing slash
 * Stored format: "www.example.cz" or "example.cz"
 */
export function normalizeWebsite(url: string): string {
	if (!url || url.trim() === "") return "";

	let normalized = url.trim();

	normalized = normalized.replace(/^https?:\/\//i, "");
	normalized = normalized.replace(/\/$/, "");

	return normalized;
}

/**
 * Validate Czech bank account format
 * Format: [prefix-]account/bank_code
 * Example: "123456-1234567890/0100" or "1234567890/0100"
 */
export function validateBankAccount(account: string): boolean {
	return /^\d{0,6}-?\d{1,10}\/\d{4}$/.test(account);
}

/**
 * Validate person name (letters, spaces, hyphens, apostrophes)
 */
export function validatePersonName(name: string): boolean {
	return /^[\p{L}\s\-']+$/u.test(name);
}

/**
 * Validate city name (letters, spaces, hyphens)
 */
export function validateCityName(city: string): boolean {
	return /^[\p{L}\s\-]+$/u.test(city);
}
