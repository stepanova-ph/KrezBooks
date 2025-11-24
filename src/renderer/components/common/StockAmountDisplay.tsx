import { Box, Chip, Typography } from "@mui/material";

interface StockAmountDisplayProps {
	amount: number;
	unit: string;
	label?: string;
}

/**
 * Displays stock amount in a bordered box with colored chip
 * Matches the style used in EditItemForm (Upravit položku)
 */
export function StockAmountDisplay({ amount, unit }: StockAmountDisplayProps) {
	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				p: 3,
				bgcolor: "background.default",
				borderRadius: 1,
				border: (theme) => `1px solid ${theme.palette.divider}`,
			}}
		>
			<Chip
				label={`${amount} ${unit}`}
				color={amount > 0 ? "success" : amount < 0 ? "error" : "default"}
				sx={{ fontWeight: 600, fontSize: "1rem" }}
			/>
		</Box>
	);
}
