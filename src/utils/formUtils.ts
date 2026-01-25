import { calculateItemTotals, getVatPercentage } from "./invoiceCalculations";

/**
 * Split bank account string into account number and bank code
 * Format: "123456789/0100" -> { accountNumber: "123456789", bankCode: "0100" }
 */
export function splitBankAccount(bankAccount: string | null | undefined): {
	accountNumber: string;
	bankCode: string;
} {
	if (!bankAccount) return { accountNumber: "", bankCode: "" };
	const parts = bankAccount.split("/");
	return {
		accountNumber: parts[0] || "",
		bankCode: parts[1] || "",
	};
}

/**
 * Combine account number and bank code into standard format
 * Format: "123456789" + "0100" -> "123456789/0100"
 */
export function combineBankAccount(
	accountNumber: string,
	bankCode: string,
): string {
	if (!accountNumber && !bankCode) return "";
	if (!bankCode) return accountNumber;
	return `${accountNumber}/${bankCode}`;
}

/**
 * Calculate item total with VAT and smart rounding
 * Smart rounding is applied per unit BEFORE multiplying by quantity
 * @deprecated Use calculateItemTotalWithVat instead
 */
export const calculateTotalWithVat = (items) => {
	return items.reduce((sum, item) => {
		const totalWithVat =
			item.total * (1 + getVatPercentage(item.vat_rate) / 100);
		return sum + totalWithVat;
	}, 0);
};

/**
 * Calculate item total with VAT including smart rounding
 * Applies smart rounding to individual item price BEFORE multiplying by quantity
 * This ensures correct totals: (price_with_vat_rounded) × quantity
 */
export function calculateItemTotalWithVat(
	pricePerUnit: number,
	amount: number,
	vatRateIndex: number,
): number {
	const { totalWithVat } = calculateItemTotals(pricePerUnit, 1, vatRateIndex);
	return totalWithVat * amount;
}

export const calculateTotalWithoutVat = (items) => {
	return items.reduce((sum, item) => sum + item.total, 0);
};
