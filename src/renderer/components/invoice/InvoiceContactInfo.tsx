import { Grid, IconButton, Tooltip } from "@mui/material";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import { FormSection } from "../common/form/FormSection";
import ValidatedTextField from "../common/inputs/ValidatedTextField";
import type { InvoiceType } from "../../../types/database";

interface InvoiceContactInfoProps {
	type: InvoiceType;
	ico: string;
	modifier: number | undefined;
	dic: string;
	companyName: string;
	street: string;
	city: string;
	postalCode: string;
	phone: string;
	email: string;
	bankAccount: string;
	errors: Record<string, string>;
	onChange: (field: string, value: string | number) => void;
	onBlur: (field: string) => void;
	onOpenContactPicker: () => void;
}

export function InvoiceContactInfo({
	type,
	ico,
	modifier,
	dic,
	companyName,
	street,
	city,
	postalCode,
	phone,
	email,
	bankAccount,
	errors,
	onChange,
	onBlur,
	onOpenContactPicker,
}: InvoiceContactInfoProps) {
	const requiresContactInfo = type === 2 || type === 4;

	return (
		<FormSection
			hideDivider
			title="Kontaktní informace"
			actions={
				<Tooltip title="Vybrat z adresáře">
					<IconButton
						size="small"
						onClick={onOpenContactPicker}
						color="primary"
					>
						<PersonSearchIcon />
					</IconButton>
				</Tooltip>
			}
		>
			<Grid container spacing={2}>
				<Grid item xs={8}>
					<ValidatedTextField
						label="IČO"
						name="ico"
						value={ico}
						onChange={(e: { target: { value: string | number; }; }) => onChange("ico", e.target.value)}
						onBlur={() => onBlur("ico")}
						error={errors.ico}
						required={requiresContactInfo}
						fullWidth
					/>
				</Grid>

				<Grid item xs={4}>
					<ValidatedTextField
						label="Mod"
						name="modifier"
						type="number"
						value={modifier ?? ""}
						onChange={(e: { target: { value: any; }; }) =>
							onChange("modifier", e.target.value ? Number(e.target.value) : "")
						}
						onBlur={() => onBlur("modifier")}
						error={errors.modifier}
						required={requiresContactInfo}
						fullWidth
					/>
				</Grid>

				<Grid item xs={12}>
					<ValidatedTextField
						label="DIČ"
						name="dic"
						value={dic}
						onChange={(e: { target: { value: string | number; }; }) => onChange("dic", e.target.value)}
						onBlur={() => onBlur("dic")}
						error={errors.dic}
						fullWidth
					/>
				</Grid>

				<Grid item xs={12}>
					<ValidatedTextField
						label="Název firmy"
						name="company_name"
						value={companyName}
						onChange={(e: { target: { value: string | number; }; }) => onChange("company_name", e.target.value)}
						onBlur={() => onBlur("company_name")}
						error={errors.company_name}
						required={requiresContactInfo}
						fullWidth
					/>
				</Grid>

				<Grid item xs={12}>
					<ValidatedTextField
						label="Ulice"
						name="street"
						value={street}
						onChange={(e: { target: { value: string | number; }; }) => onChange("street", e.target.value)}
						onBlur={() => onBlur("street")}
						error={errors.street}
						fullWidth
					/>
				</Grid>

				<Grid item xs={8}>
					<ValidatedTextField
						label="Město"
						name="city"
						value={city}
						onChange={(e: { target: { value: string | number; }; }) => onChange("city", e.target.value)}
						onBlur={() => onBlur("city")}
						error={errors.city}
						fullWidth
					/>
				</Grid>

				<Grid item xs={4}>
					<ValidatedTextField
						label="PSČ"
						name="postal_code"
						value={postalCode}
						onChange={(e: { target: { value: string | number; }; }) => onChange("postal_code", e.target.value)}
						onBlur={() => onBlur("postal_code")}
						error={errors.postal_code}
						fullWidth
					/>
				</Grid>

				<Grid item xs={12}>
					<ValidatedTextField
						label="Telefon"
						name="phone"
						value={phone}
						onChange={(e: { target: { value: string | number; }; }) => onChange("phone", e.target.value)}
						onBlur={() => onBlur("phone")}
						error={errors.phone}
						fullWidth
					/>
				</Grid>

				<Grid item xs={12}>
					<ValidatedTextField
						label="Email"
						name="email"
						value={email}
						onChange={(e: { target: { value: string | number; }; }) => onChange("email", e.target.value)}
						onBlur={() => onBlur("email")}
						error={errors.email}
						fullWidth
					/>
				</Grid>

				<Grid item xs={12}>
					<ValidatedTextField
						label="Bankovní účet"
						name="bank_account"
						value={bankAccount}
						onChange={(e: { target: { value: string | number; }; }) => onChange("bank_account", e.target.value)}
						onBlur={() => onBlur("bank_account")}
						error={errors.bank_account}
						fullWidth
					/>
				</Grid>
			</Grid>
		</FormSection>
	);
}
