/**
 * Generate valid Czech IČO with checksum
 */
export function generateValidICO(base: string): string {
	const weights = [8, 7, 6, 5, 4, 3, 2];
	let sum = 0;

	for (let i = 0; i < 7; i++) {
		sum += parseInt(base[i], 10) * weights[i];
	}

	const mod = sum % 11;
	const check = mod === 0 ? 1 : mod === 1 ? 0 : 11 - mod;

	return base + check.toString();
}
