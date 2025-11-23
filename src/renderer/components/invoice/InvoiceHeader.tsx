import { Grid, MenuItem } from "@mui/material";
import { FormSection } from "../common/form/FormSection";
import ValidatedTextField from "../common/inputs/ValidatedTextField";
import { INVOICE_TYPES, PAYMENT_METHOD_TYPES } from "../../../config/constants";
import type { InvoiceType, PaymentMethodType } from "../../../types/database";
import ValidatedDateField from "../common/inputs/ValidatedDatefield";

interface InvoiceHeaderProps {
	number: string;
	prefix: string;
	type: InvoiceType;
	paymentMethod?: PaymentMethodType;
	dateIssue: string;
	dateTax: string;
	dateDue: string;
	variableSymbol: string;
	errors: Record<string, string>;
	onChange: (field: string, value: string | number) => void;
	onBlur: (field: string) => void;
	disabled?: true;
}

function headerType5({
	number,
	prefix,
	dateIssue,
	errors,
	disabled,
	onChange,
	onBlur,
}: Partial<InvoiceHeaderProps>) {
	return (
		<FormSection title="Hlavička" my={2}>
			<Grid container spacing={2}>
				<Grid item xs={3.8}>
					<ValidatedTextField
						select
						required
						fullWidth
						label="Typ dokladu"
						name="type"
						value={5}
						disabled={disabled}
						error={errors?.type}
						onChange={(e: { target: { value: string | number } }) => {
							if (onChange) {
								onChange("type", e.target.value);
							}
						}}
						onBlur={() => {
							if (onBlur) {
								onBlur("type");
							}
						}}
					>
						{INVOICE_TYPES.map((option) => (
							<MenuItem key={option.value} value={option.value}>
								{option.label}
							</MenuItem>
						))}
					</ValidatedTextField>
				</Grid>

				<Grid item xs={2}>
					<ValidatedTextField
						fullWidth
						label="Prefix"
						name="prefix"
						value={prefix}
						error={errors?.prefix}
						disabled={disabled}
						onChange={(e: { target: { value: string | number } }) => {
							if (onChange) {
								onChange("prefix", e.target.value);
							}
						}}
						onBlur={() => {
							if (onBlur) {
								onBlur("prefix");
							}
						}}
						inputProps={{
							style: { textTransform: "uppercase", textAlign: "right" },
						}}
					/>
				</Grid>

				<Grid item xs={3.1}>
					<ValidatedTextField
						required
						fullWidth
						label="Číslo dokladu"
						name="number"
						value={number}
						error={errors?.number}
						disabled={disabled}
						onChange={(e: { target: { value: string | number } }) => {
							if (onChange) {
								onChange("number", e.target.value);
							}
						}}
						onBlur={() => {
							if (onBlur) {
								onBlur("number");
							}
						}}
					/>
				</Grid>

				<Grid item xs={3.1}>
					<ValidatedDateField
						label="Datum vystavení"
						name="date_issue"
						value={dateIssue}
						onChange={(value) => onChange("date_issue", value)}
						onBlur={() => onBlur("date_issue")}
						error={errors?.date_issue}
						required
						disabled={disabled}
						fullWidth
					/>
				</Grid>
			</Grid>
		</FormSection>
	);
}

export function InvoiceHeader({
	number,
	prefix,
	type, // 1: nákup hotovost, 2: nákup faktura, 3: prodej hotovost, 4: prodej faktura, 5: korekce
	paymentMethod,
	dateIssue,
	dateTax,
	dateDue,
	variableSymbol,
	errors,
	disabled,
	onChange,
	onBlur,
}: InvoiceHeaderProps) {
	const isType5 = type === 5;
	const showDateTax = (type as number) >= 1 && (type as number) <= 4; // 1–4
	const showDateDue = type === 2 || type === 4; // 2,4
	const requireInvoiceFields24 = type === 2 || type === 4; // for variable_symbol (+ your ICO/mod elsewhere)
	const showPaymentMethod = type === 2 || type === 4; // keep your original behavior

	if (isType5) {
		return headerType5({
			number,
			prefix,
			dateIssue,
			errors,
			disabled,
			onChange,
			onBlur,
		});
	}

	return (
		<FormSection title="Hlavička" my={2}>
			<Grid container spacing={2}>
				<Grid item xs={5.3}>
					<ValidatedTextField
						label="Typ dokladu"
						name="type"
						value={type}
						onChange={(e: { target: { value: any } }) =>
							onChange("type", Number(e.target.value))
						}
						onBlur={() => onBlur("type")}
						error={errors.type}
						select
						required
						disabled={disabled}
						fullWidth
						sx={{
							".MuiInputBase-input": {
								// fontSize: showDateTax ? "0.78rem" : undefined,
							},
						}}
					>
						{INVOICE_TYPES.map((option) => (
							<MenuItem key={option.value} value={option.value}>
								{option.label}
							</MenuItem>
						))}
					</ValidatedTextField>
				</Grid>

				<Grid item xs={2.4}>
					<ValidatedTextField
						label="Prefix"
						name="prefix"
						value={prefix}
						onChange={(e: { target: { value: string | number } }) =>
							onChange("prefix", e.target.value)
						}
						onBlur={() => onBlur("prefix")}
						error={errors.prefix}
						disabled={disabled}
						fullWidth
					/>
				</Grid>

				<Grid item xs={4.3}>
					<ValidatedTextField
						label="Číslo dokladu"
						name="number"
						value={number}
						onChange={(e: { target: { value: string | number } }) =>
							onChange("number", e.target.value)
						}
						onBlur={() => onBlur("number")}
						error={errors.number}
						required
						disabled={disabled}
						fullWidth
					/>
				</Grid>

				<Grid item xs={showDateDue ? 4 : 6}>
					<ValidatedDateField
						label="Datum vystavení"
						name="date_issue"
						value={dateIssue}
						onChange={(value) => onChange("date_issue", value)}
						onBlur={() => onBlur("date_issue")}
						error={errors.date_issue}
						required
						disabled={disabled}
						fullWidth
					/>
				</Grid>

				{showDateTax && (
					<Grid item xs={showDateDue ? 4 : 6}>
						<ValidatedDateField
							label="Datum zdanitelného plnění"
							name="date_tax"
							value={dateTax}
							onChange={(value) => onChange("date_tax", value)}
							onBlur={() => onBlur("date_tax")}
							error={errors.date_tax}
							required
							disabled={disabled}
							fullWidth
						/>
					</Grid>
				)}

				{showDateDue && (
					<Grid item xs={4}>
						<ValidatedDateField
							label="Datum splatnosti"
							name="date_due"
							value={dateDue}
							onChange={(value) => onChange("date_due", value)}
							onBlur={() => onBlur("date_due")}
							error={errors.date_due}
							required
							disabled={disabled}
							fullWidth
						/>
					</Grid>
				)}

				{showPaymentMethod && (
					<Grid item xs={6}>
						<ValidatedTextField
							label="Způsob platby"
							name="payment_method"
							value={paymentMethod ?? ""}
							onChange={(e: { target: { value: any } }) =>
								onChange("payment_method", Number(e.target.value))
							}
							onBlur={() => onBlur("payment_method")}
							error={errors.payment_method}
							select
							disabled={disabled}
							fullWidth
						>
							<MenuItem value="">
								<em>Žádný</em>
							</MenuItem>
							{PAYMENT_METHOD_TYPES.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</ValidatedTextField>
					</Grid>
				)}

				{/* Variabilní symbol – jen 2,4 (povinné) */}
				{requireInvoiceFields24 && (
					<Grid item xs={6}>
						<ValidatedTextField
							label="Variabilní symbol"
							name="variable_symbol"
							value={variableSymbol}
							onChange={(e: { target: { value: string | number } }) =>
								onChange("variable_symbol", e.target.value)
							}
							onBlur={() => onBlur("variable_symbol")}
							error={errors.variable_symbol}
							required
							disabled={disabled}
							fullWidth
						/>
					</Grid>
				)}
			</Grid>
		</FormSection>
	);
}
