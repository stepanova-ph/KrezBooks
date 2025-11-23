import React, { useState } from "react";
import { Box, Grid, MenuItem, Typography, Chip } from "@mui/material";
import type { CreateItemInput, Item, VatRate } from "../../../types/database";
import { itemSchema } from "../../../validation/itemSchema";
import { FormDialog } from "../common/form/FormDialog";
import { NumberTextField } from "../common/inputs/NumberTextField";
import { VatPriceField } from "../common/inputs/VatPriceField";
import { FormSection } from "../common/form/FormSection";
import ValidatedTextField from "../common/inputs/ValidatedTextField";
import { useItemCategories } from "../../../hooks/useItems";
import {
	useStockAmountByItem,
	useAverageBuyPriceByItem,
	useLastBuyPriceByItem,
} from "../../../hooks/useStockMovement";
import { ValidatedAutocomplete } from "../common/inputs/ValidatedAutocomplete";
import { VAT_RATES, UNIT_OPTIONS } from "../../../config/constants";

interface ItemFormProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: CreateItemInput) => Promise<void>;
	initialData?: Partial<Item>;
	mode: "create" | "edit";
	isPending?: boolean;
}

const defaultFormData: CreateItemInput = {
	ean: "",
	name: "",
	category: "",
	note: "",
	vat_rate: 2,
	unit_of_measure: "",
	sale_price_group1: 0,
	sale_price_group2: 0,
	sale_price_group3: 0,
	sale_price_group4: 0,
};

function ItemForm({
	open,
	onClose,
	onSubmit,
	initialData,
	mode,
	isPending = false,
}: ItemFormProps) {
	const [formData, setFormData] = useState<CreateItemInput>(
		initialData ? { ...defaultFormData, ...initialData } : defaultFormData,
	);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const { data: existingCategories = [] } = useItemCategories();

	// Fetch stock data for edit mode only
	const itemEan = mode === "edit" && initialData?.ean ? initialData.ean : "";
	const { data: stockAmount = 0 } = useStockAmountByItem(itemEan);
	const { data: avgBuyPrice = 0 } = useAverageBuyPriceByItem(itemEan);
	const { data: lastBuyPrice = 0 } = useLastBuyPriceByItem(itemEan);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
		setFormData((p) => ({ ...p, [name]: value }));
	};

	const handleSelectChange = (
		e: React.ChangeEvent<{ name?: string; value: unknown }>,
	) => {
		const name = e.target.name as string;
		const value = e.target.value;
		if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
		setFormData((p) => ({ ...p, [name]: value }));
	};

	const handleBlur = (field: string) => {
		const result = itemSchema.safeParse(formData);
		if (!result.success) {
			const fieldError = result.error.errors.find((e) => e.path[0] === field);
			if (fieldError) {
				setErrors((p) => ({ ...p, [field]: fieldError.message }));
			}
		}
	};

	const handleSubmit = async () => {
		const result = itemSchema.safeParse(formData);
		if (!result.success) {
			const newErrors: Record<string, string> = {};
			result.error.errors.forEach((err) => {
				if (err.path[0]) newErrors[err.path[0] as string] = err.message;
			});
			setErrors(newErrors);
			return;
		}

		await onSubmit(formData);
	};

	const title = mode === "create" ? "Přidat novou položku" : "Upravit položku";
	const submitLabel = mode === "create" ? "Přidat položku" : "Uložit změny";

	const vatPercentage =
		VAT_RATES[formData.vat_rate as keyof typeof VAT_RATES]?.percentage ?? 21;

	return (
		<FormDialog
			open={open}
			onClose={onClose}
			title={title}
			onSubmit={handleSubmit}
			isPending={isPending}
			submitLabel={submitLabel}
			mode={mode}
		>
			<FormSection title="Základní informace">
				<Grid container spacing={2} alignItems="center">
					<Grid item xs={12} md={3.5}>
						<ValidatedTextField
							size="small"
							label="EAN"
							name="ean"
							value={formData.ean}
							onChange={handleChange}
							onBlur={() => handleBlur("ean")}
							error={errors.ean}
							required
							fullWidth
							disabled={mode === "edit"}
							inputProps={{ autoComplete: "off" }}
						/>
					</Grid>
					<Grid item xs={12} md={8.5}>
						<ValidatedTextField
							size="small"
							label="Název položky"
							name="name"
							value={formData.name}
							onChange={handleChange}
							onBlur={() => handleBlur("name")}
							error={errors.name}
							required
							fullWidth
							inputProps={{ autoComplete: "off" }}
						/>
					</Grid>

					<Grid item xs={12} md={4.95}>
						<ValidatedAutocomplete
							size="small"
							freeSolo
							options={existingCategories}
							value={formData.category || ""}
							onChange={(_, newValue) => {
								setFormData((p) => ({ ...p, category: newValue || "" }));
								if (errors.category) setErrors((p) => ({ ...p, category: "" }));
							}}
							onInputChange={(_, newInputValue) => {
								setFormData((p) => ({ ...p, category: newInputValue }));
								if (errors.category) setErrors((p) => ({ ...p, category: "" }));
							}}
							label="Kategorie"
							name="category"
							error={errors.category}
							onBlur={() => handleBlur("category")}
						/>
					</Grid>

					<Grid item xs={12} md={3.25}>
						<ValidatedAutocomplete
							disableClearable
							size="small"
							freeSolo
							options={UNIT_OPTIONS}
							value={formData.unit_of_measure}
							onChange={(_, newValue) => {
								setFormData((p) => ({
									...p,
									unit_of_measure: newValue || "",
								}));
								if (errors.unit_of_measure)
									setErrors((p) => ({ ...p, unit_of_measure: "" }));
							}}
							onInputChange={(_, newInputValue) => {
								setFormData((p) => ({
									...p,
									unit_of_measure: newInputValue,
								}));
								if (errors.unit_of_measure)
									setErrors((p) => ({ ...p, unit_of_measure: "" }));
							}}
							label="Jednotka"
							name="unit_of_measure"
							error={errors.unit_of_measure}
							required
							onBlur={() => handleBlur("unit_of_measure")}
						/>
					</Grid>

					<Grid item xs={12} md={3.8}>
						<ValidatedTextField
							size="small"
							label="Sazba DPH"
							name="vat_rate"
							value={formData.vat_rate}
							onChange={handleSelectChange}
							onBlur={() => handleBlur("vat_rate")}
							error={errors.vat_rate}
							select
							required
							fullWidth
						>
							{VAT_RATES.map((rate) => (
								<MenuItem key={rate.value} value={rate.value}>
									{rate.label}
								</MenuItem>
							))}
						</ValidatedTextField>
					</Grid>

					<Grid item xs={12}>
						<ValidatedTextField
							size="small"
							label="Poznámka"
							name="note"
							value={formData.note}
							onChange={handleChange}
							onBlur={() => handleBlur("note")}
							error={errors.note}
							multiline
							rows={2}
							fullWidth
							inputProps={{ autoComplete: "off" }}
						/>
					</Grid>
				</Grid>
			</FormSection>

			<FormSection title="Ceny">
				<Box sx={{ display: "flex", gap: 3 }}>
					{/* Purchase Prices + Stock - Only in edit mode */}
					{mode === "edit" && (
						<Box sx={{ flex: "0 0 180px" }}>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{
									mb: 1,
									display: "block",
									fontWeight: 500,
									textTransform: "uppercase",
									letterSpacing: "0.5px",
								}}
							>
								Nákupní ceny
							</Typography>
							<Grid container spacing={1.5}>
								<Grid item xs={12}>
									<NumberTextField
										size="small"
										disabled
										label="Průměrná"
										name="avg_buy_price"
										value={avgBuyPrice}
										onChange={() => {}}
										precision={2}
										min={0}
										grayWhenZero
										fullWidth
									/>
								</Grid>
								<Grid item xs={12}>
									<NumberTextField
										size="small"
										disabled
										label="Poslední"
										name="last_buy_price"
										value={lastBuyPrice}
										onChange={() => {}}
										precision={2}
										min={0}
										grayWhenZero
										fullWidth
									/>
								</Grid>
							</Grid>

							{/* Stock info section */}
							<Box sx={{ mt: 3 }}>
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{
										mb: 1,
										display: "block",
										fontWeight: 500,
										textTransform: "uppercase",
										letterSpacing: "0.5px",
									}}
								>
									Počet na skladě
								</Typography>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										p: 2,
										bgcolor: "background.default",
										borderRadius: 1,
										border: (theme) => `1px solid ${theme.palette.divider}`,
									}}
								>
									<Chip
										label={`${stockAmount} ${formData.unit_of_measure}`}
										color={
											stockAmount > 0
												? "success"
												: stockAmount < 0
													? "error"
													: "default"
										}
										sx={{ fontWeight: 600, fontSize: "0.875rem" }}
									/>
								</Box>
							</Box>
						</Box>
					)}

					{/* Sales Prices - Larger column */}
					<Box sx={{ flex: 1 }}>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{
								mb: 1,
								display: "block",
								fontWeight: 500,
								textTransform: "uppercase",
								letterSpacing: "0.5px",
								paddingLeft: mode === "edit" ? 8 : 0,
							}}
						>
							Prodejní ceny dle skupiny
						</Typography>
						<Grid container spacing={1.5}>
							<Grid item xs={12}>
								<VatPriceField
									size="small"
									label="Skupina 1"
									name="sale_price_group1"
									value={formData.sale_price_group1}
									vatRate={vatPercentage}
									onChange={handleChange}
									onBlur={() => handleBlur("sale_price_group1")}
									error={errors.sale_price_group1}
									precision={2}
									min={0}
								/>
							</Grid>
							<Grid item xs={12}>
								<VatPriceField
									size="small"
									label="Skupina 2"
									name="sale_price_group2"
									value={formData.sale_price_group2}
									vatRate={vatPercentage}
									onChange={handleChange}
									onBlur={() => handleBlur("sale_price_group2")}
									error={errors.sale_price_group2}
									precision={2}
									min={0}
								/>
							</Grid>
							<Grid item xs={12}>
								<VatPriceField
									size="small"
									label="Skupina 3"
									name="sale_price_group3"
									value={formData.sale_price_group3}
									vatRate={vatPercentage}
									onChange={handleChange}
									onBlur={() => handleBlur("sale_price_group3")}
									error={errors.sale_price_group3}
									precision={2}
									min={0}
								/>
							</Grid>
							<Grid item xs={12}>
								<VatPriceField
									size="small"
									label="Skupina 4"
									name="sale_price_group4"
									value={formData.sale_price_group4}
									vatRate={vatPercentage}
									onChange={handleChange}
									onBlur={() => handleBlur("sale_price_group4")}
									error={errors.sale_price_group4}
									precision={2}
									min={0}
								/>
							</Grid>
						</Grid>
					</Box>
				</Box>
			</FormSection>
		</FormDialog>
	);
}

export default ItemForm;
