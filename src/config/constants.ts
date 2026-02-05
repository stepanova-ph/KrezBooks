export const DIC_PREFIXES = ["CZ", "SK", "PL", "vlastní"];

export const VAT_RATES = [
	{ value: 0, percentage: 0, label: "0% (osvobozeno)" },
	{ value: 1, percentage: 12, label: "12% (snížená)" },
	{ value: 2, percentage: 21, label: "21% (základní)" },
] as const;

export const VALID_VAT_RATE_VALUES: number[] = VAT_RATES.map((rate) => rate.value);
export const VAT_RATE_PERCENTAGES: number[] = VAT_RATES.map((rate) => rate.percentage);

/** VAT rate options for dropdowns/selects - derived from VAT_RATES */
export const VAT_RATE_OPTIONS = VAT_RATES.map((rate) => ({
	value: rate.value,
	label: rate.label,
}));

export const PRICE_GROUPS = [1, 2, 3, 4] as const;

export const UNIT_OPTIONS = ["ks", "kg", "l", "m", "m2", "m3"] as const;

export const CONTACT_TYPES = {
	supplier: { label: "Dodavatel" },
	customer: { label: "Odběratel" },
};

export const CURRENCIES = [
	{ value: false, code: "CZK", symbol: "Kč", label: "Koruna (CZK)" },
	{ value: true, code: "EUR", symbol: "€", label: "Euro (EUR)" },
] as const;

export const PAYMENT_METHOD_TYPES = [
	{ value: 0, label: "Hotovost" },
	{ value: 1, label: "Bankovní převod" },
	{ value: 2, label: "Karta" },
] as const;

export const INVOICE_TYPES = [
	{ value: 1, label: "Nákup (hotovost)", shortLabel: "NH", prefix: "NH" },
	{ value: 2, label: "Nákup (faktura)", shortLabel: "NF", prefix: "NF" },
	{ value: 3, label: "Prodej (hotovost)", shortLabel: "PH", prefix: "PH" },
	{ value: 4, label: "Prodej (faktura)", shortLabel: "PF", prefix: "PF" },
	{ value: 5, label: "Korekce skladu", shortLabel: "K", prefix: "K" },
] as const;

// Default invoice type for new invoices
export const DEFAULT_INVOICE_TYPE = 3; // Prodej (hotovost)

// Date offset in days for auto-calculation
export const DATE_TAX_OFFSET_DAYS = 0; // Date of taxable supply = same as issue date
export const DATE_DUE_OFFSET_DAYS = 14; // Due date = 14 days after issue date
