export const DIC_PREFIXES = ["CZ", "SK", "vlastní"];

export const VAT_RATES = [
	{ percentage: 0, label: "0% (osvobozeno)" },
	{ percentage: 12, label: "12% (snížená)" },
	{ percentage: 21, label: "21% (základní)" },
] as const;

export const PRICE_GROUPS = [1, 2, 3, 4] as const;

export const UNIT_OPTIONS = ["ks", "kg", "l", "m", "m2", "m3"] as const;

export const CONTACT_TYPES = {
	supplier: { label: "Dodavatel" },
	customer: { label: "Odběratel" },
};

export const INVOICE_TYPES = [
	{ value: 1, label: "Nákup (hotovost)" },
	{ value: 2, label: "Nákup (faktura)" },
	{ value: 3, label: "Prodej (hotovost)" },
	{ value: 4, label: "Prodej (faktura)" },
	{ value: 5, label: "Korekce skladu" },
] as const;

export const PAYMENT_METHOD_TYPES = [
	{ value: 0, label: "Hotovost" },
	{ value: 1, label: "Bankovní převod" },
] as const;
