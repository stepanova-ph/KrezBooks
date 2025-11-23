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
		// <Box
		// 	sx={{
		// 		border: (theme) => `1px solid ${theme.palette.divider}`,
		// 		borderRadius: 1,
		// 		p: 1.5,
		// 		display: "flex",
		// 		flexDirection: "column",
		// 		gap: 0.5,
		// 	}}
		// >
		// 	<Box sx={{ display: "flex", justifyContent: "center" }}>
		// 		<Chip
		// 			label={`${amount} ${unit}`}
		// 			color={
		// 				amount > 0
		// 					? "success"
		// 					: amount < 0
		// 						? "error"
		// 						: "default"
		// 			}
		// 			sx={{
		// 				fontWeight: 600,
		// 				fontSize: "0.875rem",
		// 				minWidth: 70,
		// 			}}
		// 		/>
		// 	</Box>
		// </Box>
	);
}
