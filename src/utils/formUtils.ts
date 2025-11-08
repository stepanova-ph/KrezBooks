import { DIC_PREFIXES } from "../config/constants";

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

export const calculateTotalWithVat = (items) => {
	return items.reduce((sum, item) => {
		const totalWithVat = item.total * (1 + item.vat_rate / 100);
		return sum + totalWithVat;
	}, 0);
};

export const calculateTotalWithoutVat = (items) => {
	return items.reduce((sum, item) => sum + item.total, 0);
};
