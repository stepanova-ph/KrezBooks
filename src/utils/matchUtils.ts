const normalizePhone = (digits: string | null | undefined) => {
	if (!digits) return "";
	return digits.replace(/^(\+420|420||00420|421|00421)/, "").replace(/\D/g, "");
};

export function matchPhone(value: string | null | undefined, query: string): boolean {
	if (!value || !query) return false;

	const normalizedValue = normalizePhone(value);
	const normalizedQuery = normalizePhone(query);

	if (normalizedQuery === "") return false;

	return normalizedValue.startsWith(normalizedQuery);
}