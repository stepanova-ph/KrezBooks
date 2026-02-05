import { Box, Typography } from "@mui/material";
import type { InvoiceItem } from "../../../hooks/useInvoiceForm";
import { getCurrencySymbol } from "../../../utils/formattingUtils";

interface InvoiceTotalsProps {
	items: InvoiceItem[];
	isInEur?: boolean;
}

function calculateTotals(items: InvoiceItem[]) {
	let totalWithoutVat = 0;
	let totalVat = 0;
	let totalWithVat = 0;

	items.forEach((item) => {
		// Items already have smart-rounded totals, just sum them up
		// Don't apply smart rounding again on totals (that's only for print service)
		const basePrice = item.sale_price * item.amount;
		const vatRateDecimal = [0, 0.12, 0.21][item.vat_rate] || 0;
		const vatAmount = basePrice * vatRateDecimal;

		totalWithoutVat += basePrice;
		totalVat += vatAmount;
		totalWithVat += item.total; // Use pre-calculated smart-rounded total
	});

	return {
		totalWithoutVat,
		totalVat,
		totalWithVat,
	};
}

export function InvoiceTotals({ items, isInEur = false }: InvoiceTotalsProps) {
	const { totalWithoutVat, totalVat, totalWithVat } = calculateTotals(items);
	const currencySymbol = getCurrencySymbol(isInEur);

	return (
		<Box
			sx={{
				borderTop: (theme) => `1px solid ${theme.palette.divider}`,
				bgcolor: "background.paper",
			}}
		>
			<Box
				sx={{
					px: 4,
					py: 2.5,
					display: "flex",
					justifyContent: "flex-end",
					gap: 8,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					<Typography variant="body1" fontWeight={500} color="text.secondary">
						Celkem bez DPH:
					</Typography>
					<Typography variant="h6" fontWeight={700}>
						{totalWithoutVat.toFixed(2)} {currencySymbol}
					</Typography>
				</Box>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					<Typography variant="body1" fontWeight={500} color="text.secondary">
						DPH:
					</Typography>
					<Typography variant="h6" fontWeight={700} color="text.primary">
						{totalVat.toFixed(2)} {currencySymbol}
					</Typography>
				</Box>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					<Typography variant="body1" fontWeight={500} color="text.secondary">
						Celkem s DPH:
					</Typography>
					<Typography variant="h6" fontWeight={700} color="primary.main">
						{totalWithVat.toFixed(2)} {currencySymbol}
					</Typography>
				</Box>
			</Box>
		</Box>
	);
}
