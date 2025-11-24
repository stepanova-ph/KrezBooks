import { Box, Typography } from "@mui/material";
import type { InvoiceItem } from "../../../hooks/useInvoiceForm";
import { VAT_RATES } from "../../../config/constants";

interface InvoiceTotalsProps {
	items: InvoiceItem[];
}

function calculateItemTotals(item: InvoiceItem) {
	const vatPercentage =
		VAT_RATES.find((rate) => rate.value === item.vat_rate)?.percentage ?? 0;

	const basePrice = item.sale_price * item.amount;
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

function calculateTotals(items: InvoiceItem[]) {
	let totalWithoutVat = 0;
	let totalVat = 0;
	let totalWithVat = 0;

	items.forEach((item) => {
		const {
			basePrice,
			vatAmount,
			totalWithVat: itemTotal,
		} = calculateItemTotals(item);
		totalWithoutVat += basePrice;
		totalVat += vatAmount;
		totalWithVat += itemTotal;
	});

	return {
		totalWithoutVat,
		totalVat,
		totalWithVat,
	};
}

export function InvoiceTotals({ items }: InvoiceTotalsProps) {
	const { totalWithoutVat, totalVat, totalWithVat } = calculateTotals(items);

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
						{totalWithoutVat.toFixed(2)} Kč
					</Typography>
				</Box>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					<Typography variant="body1" fontWeight={500} color="text.secondary">
						DPH:
					</Typography>
					<Typography variant="h6" fontWeight={700} color="text.primary">
						{totalVat.toFixed(2)} Kč
					</Typography>
				</Box>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					<Typography variant="body1" fontWeight={500} color="text.secondary">
						Celkem s DPH:
					</Typography>
					<Typography variant="h6" fontWeight={700} color="primary.main">
						{totalWithVat.toFixed(2)} Kč
					</Typography>
				</Box>
			</Box>
		</Box>
	);
}
