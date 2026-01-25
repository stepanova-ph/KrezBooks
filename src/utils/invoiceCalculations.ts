import { VAT_RATES } from "../config/constants";

/** Get VAT rate percentage by value index, with fallback to 21% */
export const getVatPercentage = (vatRateValue: number): number => {
	const rate = VAT_RATES.find((r) => r.value === vatRateValue);
	return rate?.percentage ?? 21;
};

/**
 * Calculate item totals with VAT including smart rounding
 * Smart rounding: transfer 1 cent between VAT and total when total is .99 or .01
 */
export function calculateItemTotals(
	pricePerUnit: number,
	amount: number,
	vatRateIndex: number,
) {
	const vatPercentage = getVatPercentage(vatRateIndex);

	const basePrice = pricePerUnit * amount;
	let vatAmount = basePrice * (vatPercentage / 100);
	let totalWithVat = basePrice + vatAmount;

	// Smart rounding: transfer 1 cent between VAT and total when total is .99 or .01
	if (vatPercentage > 0 && basePrice > 0) {
		const cents = Math.round((totalWithVat % 1) * 100);

		if (cents === 99) {
			vatAmount += 0.01;
		} else if (cents === 1) {
			vatAmount -= 0.01;
		}
		totalWithVat = basePrice + vatAmount;
	}

	return {
		basePrice,
		vatAmount,
		totalWithVat,
	};
}
