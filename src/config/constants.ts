export const DIC_PREFIXES = ["CZ", "SK", "PL", "vlastní"];

export const VAT_RATES = [
	{ value: 0, percentage: 0, label: "0% (osvobozeno)" },
	{ value: 1, percentage: 12, label: "12% (snížená)" },
	{ value: 2, percentage: 21, label: "21% (základní)" },
] as const;

export const PRICE_GROUPS = [1, 2, 3, 4] as const;

export const UNIT_OPTIONS = ["ks", "kg", "l", "m", "m2", "m3"] as const;

export const CONTACT_TYPES = {
	supplier: { label: "Dodavatel" },
	customer: { label: "Odběratel" },
};

export const PAYMENT_METHOD_TYPES = [
	{ value: 0, label: "Hotovost" },
	{ value: 1, label: "Bankovní převod" },
] as const;

export const INVOICE_TYPES = [
	{ value: 1, label: "Nákup (hotovost)", prefix: "NH" },
	{ value: 2, label: "Nákup (faktura)", prefix: "NF" },
	{ value: 3, label: "Prodej (hotovost)", prefix: "PH" },
	{ value: 4, label: "Prodej (faktura)", prefix: "PF" },
	{ value: 5, label: "Korekce skladu", prefix: "K" },
] as const;
