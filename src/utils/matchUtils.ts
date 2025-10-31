const normalizePhone = (digits: string) =>
	digits.replace(/^(420|00420|421|00421)/, "").replace(/\D/g, "");

export function matchPhone(value: string, query: string): boolean {
	if (!value || !query) return false;

	const normalizedValue = normalizePhone(value);
	const normalizedQuery = normalizePhone(query);

	return normalizedValue.startsWith(normalizedQuery);
}
