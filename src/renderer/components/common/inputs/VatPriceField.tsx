import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, Chip } from "@mui/material";
import { NumberTextField } from "./NumberTextField";

interface VatPriceFieldProps {
	label?: string;
	name: string;
	value: number;
	vatRate: number;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onBlur?: () => void;
	error?: string;
	precision?: number;
	min?: number;
	grayWhenZero?: boolean;
	size?: "small" | "medium";
	readonly?: true;
}

export function VatPriceField({
	label,
	name,
	value,
	vatRate,
	onChange,
	onBlur,
	error,
	precision = 2,
	min = 0,
	grayWhenZero,
	size = "small",
	readonly,
}: VatPriceFieldProps) {
	const [basePrice, setBasePrice] = useState<number>(value);

	const numericBasePrice = Number(basePrice) || 0;

	let calculatedVatAmount = numericBasePrice * (vatRate / 100);
	let calculatedPriceWithVat = numericBasePrice + calculatedVatAmount;

	if (vatRate > 0 && numericBasePrice > 0) {
		const cents = Math.round((calculatedPriceWithVat % 1) * 100);

		if (cents === 99) {
			calculatedVatAmount += 0.01;
		} else if (cents === 1) {
			calculatedVatAmount -= 0.01;
		}
		calculatedPriceWithVat = numericBasePrice + calculatedVatAmount;
	}

	const vatAmount = calculatedVatAmount;
	const priceWithVat = calculatedPriceWithVat;

	useEffect(() => {
		setBasePrice(Number(value) || 0);
	}, [value]);

	const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newBase = Number(parseFloat(e.target.value)) || 0;
		setBasePrice(newBase);

		const syntheticEvent = {
			...e,
			target: {
				...e.target,
				name,
				value: String(newBase),
			},
		} as React.ChangeEvent<HTMLInputElement>;

		onChange(syntheticEvent);
	};

	const handleWithVatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newPriceWithVat = Number(parseFloat(e.target.value)) || 0;
		const newBase = newPriceWithVat / (1 + vatRate / 100);
		setBasePrice(newBase);

		const syntheticEvent = {
			...e,
			target: {
				...e.target,
				name,
				value: String(newBase),
			},
		} as React.ChangeEvent<HTMLInputElement>;

		onChange(syntheticEvent);
	};

	const groupNumber = label?.match(/\d+/)?.[0] || "";

	return (
		<Box>
			<Grid container spacing={1} alignItems="center">
				<Grid item xs="auto">
					<Chip
						label={groupNumber}
						size="small"
						color="primary"
						sx={{
							height: 28,
							fontWeight: 600,
							fontSize: "0.875rem",
							minWidth: 28,
						}}
					/>
				</Grid>

				<Grid item xs>
					<Grid container spacing={1}>
						<Grid item xs={4}>
							<NumberTextField
								label="Základ"
								name={`${name}_base`}
								value={basePrice}
								onChange={handleBaseChange}
								onBlur={onBlur}
								precision={precision}
								min={min}
								grayWhenZero={grayWhenZero}
								size={size}
								disabled={readonly}
							/>
						</Grid>
						<Grid item xs={4}>
							<NumberTextField
								label="DPH"
								name={`${name}_vat`}
								value={vatAmount}
								onChange={() => {}}
								precision={precision}
								disabled
								size={size}
								sx={{
									"& .MuiInputBase-input.Mui-disabled": {
										WebkitTextFillColor: "rgba(0, 0, 0, 0.6)",
										backgroundColor: "#f5f5f5",
									},
								}}
							/>
						</Grid>
						<Grid item xs={4}>
							<NumberTextField
								label="S DPH"
								name={`${name}_with_vat`}
								value={priceWithVat}
								onChange={handleWithVatChange}
								onBlur={onBlur}
								precision={precision}
								min={min}
								grayWhenZero={grayWhenZero}
								size={size}
								disabled={readonly}
							/>
						</Grid>
					</Grid>
				</Grid>
			</Grid>

			{error && (
				<Typography
					variant="caption"
					color="error"
					sx={{ display: "block", mt: 0.5, ml: 1.75 }}
				>
					{error}
				</Typography>
			)}
		</Box>
	);
}
