import { VAT_RATES } from "../config/constants";

export const vatRateCaseStatement = VAT_RATES.map(
	(rate) => `WHEN ${rate.value} THEN ${rate.percentage / 100}`,
).join("\n            ");
