import { Box, Typography } from "@mui/material";
import type { InvoiceItem } from "../../../hooks/useInvoiceForm";
import { calculateItemTotals } from "../../../utils/invoiceCalculations";

interface InvoiceTotalsProps {
	items: InvoiceItem[];
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
		} = calculateItemTotals(item.sale_price, item.amount, item.vat_rate);
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
