import {
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Grid,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { CreateContactInput, Contact } from "../../../types/database";
import { contactSchema } from "../../../validation/contactSchema";
import { FormDialog } from "../common/form/FormDialog";
import { FormSection } from "../common/form/FormSection";
import { splitBankAccount, combineBankAccount } from "../../../utils/formUtils";
import ContactTypeSelector from "./ContactsTypeSelector";
import ValidatedTextField from "../common/inputs/ValidatedTextField";

interface ContactFormProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: CreateContactInput) => Promise<void>;
	initialData?: Partial<Contact>;
	mode: "create" | "edit";
	isPending?: boolean;
}

const defaultFormData: CreateContactInput = {
	ico: "",
	dic: "",
	modifier: 1,
	company_name: "",
	representative_name: "",
	street: "",
	city: "",
	postal_code: "",
	phone: "",
	email: "",
	website: "",
	bank_account: "",
	is_supplier: false,
	is_customer: true,
	price_group: 1,
};

function ContactForm({
	open,
	onClose,
	onSubmit,
	initialData,
	mode,
	isPending = false,
}: ContactFormProps) {
	const initialBankAccount = splitBankAccount(initialData?.bank_account);

	const [formData, setFormData] = useState<CreateContactInput>(
		initialData
			? {
					...defaultFormData,
					...initialData,
					is_customer:
						typeof initialData.is_customer === "boolean"
							? initialData.is_customer
							: !!initialData.is_customer,
					is_supplier:
						typeof initialData.is_supplier === "boolean"
							? initialData.is_supplier
							: !!initialData.is_supplier,
				}
			: defaultFormData,
	);

	const [bankAccountParts, setBankAccountParts] = useState(initialBankAccount);
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (open) {
			if (initialData) {
				setFormData({
					...defaultFormData,
					...initialData,
					is_customer:
						typeof initialData.is_customer === "boolean"
							? initialData.is_customer
							: !!initialData.is_customer,
					is_supplier:
						typeof initialData.is_supplier === "boolean"
							? initialData.is_supplier
							: !!initialData.is_supplier,
				});
				setBankAccountParts(splitBankAccount(initialData.bank_account));
			} else {
				setFormData(defaultFormData);
				setBankAccountParts({ accountNumber: "", bankCode: "" });
			}
			setErrors({});
		}
	}, [open, initialData]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;

		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}

		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? Boolean(checked) : value,
		}));
	};

	const handleBlur = (fieldName: string) => {
		const dataToValidate = {
			...formData,
			bank_account: combineBankAccount(
				bankAccountParts.accountNumber,
				bankAccountParts.bankCode,
			),
		};

		const result = contactSchema.safeParse(dataToValidate);
		if (!result.success) {
			const fieldError = result.error.issues.find(
				(err) => err.path[0] === fieldName,
			);
			if (fieldError) {
				setErrors((prev) => ({ ...prev, [fieldName]: fieldError.message }));
			}
		}
	};

	const handleBankAccountChange =
		(field: "accountNumber" | "bankCode") =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;

			if (errors.bank_account) {
				setErrors((prev) => ({ ...prev, bank_account: "" }));
			}

			setBankAccountParts((prev) => {
				const updated = { ...prev, [field]: newValue };
				setFormData((prevForm) => ({
					...prevForm,
					bank_account: combineBankAccount(
						updated.accountNumber,
						updated.bankCode,
					),
				}));
				return updated;
			});
		};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors({});

		const dataToValidate = {
			...formData,
			bank_account: combineBankAccount(
				bankAccountParts.accountNumber,
				bankAccountParts.bankCode,
			),
		};

		const result = contactSchema.safeParse(dataToValidate);
		if (!result.success) {
			const fieldErrors: Record<string, string> = {};
			result.error.issues.forEach((err) => {
				if (typeof err.path[0] === "string")
					fieldErrors[err.path[0]] = err.message;
			});
			setErrors(fieldErrors);
			return;
		}

		try {
			await onSubmit(result.data as CreateContactInput);
			if (mode === "create") {
				setFormData(defaultFormData);
				setBankAccountParts({ accountNumber: "", bankCode: "" });
			}
		} catch (error) {
			console.error("Chyba při ukládání kontaktu:", error);
			alert(`Chyba při ukládání: ${(error as Error).message}`);
		}
	};

	const title = mode === "create" ? "Přidat nový kontakt" : "Upravit kontakt";
	const submitLabel = mode === "create" ? "Přidat kontakt" : "Uložit změny";

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
			<FormSection title="Základní údaje">
				<Grid container spacing={2} alignItems="center">
					<Grid item md={4.8} mr={-0.5}>
						<ValidatedTextField
							label="IČO"
							name="ico"
							value={formData.ico}
							onChange={handleChange}
							onBlur={() => handleBlur("ico")}
							error={errors.ico}
							grayWhenEmpty
							required
							disabled={mode === "edit"}
							fullWidth
						/>
					</Grid>

					<Grid item md={1.3}>
						<ValidatedTextField
							label="Mod"
							name="modifier"
							type="number"
							value={formData.modifier}
							onChange={handleChange}
							onBlur={() => handleBlur("modifier")}
							error={errors.modifier}
							grayWhenZero
							inputProps={{ step: "1" }}
							disabled={mode === "edit"}
							fullWidth
						/>
					</Grid>

					<Grid item md={5.9}>
						<ValidatedTextField
							label="DIČ"
							name="dic"
							value={formData.dic}
							onChange={handleChange}
							onBlur={() => handleBlur("dic")}
							error={errors.dic}
							placeholder="CZ12345678"
							fullWidth
						/>
					</Grid>
				</Grid>

				<Grid container spacing={2} alignItems="center">
					<Grid item md={6}>
						<ValidatedTextField
							label="Název firmy"
							name="company_name"
							value={formData.company_name}
							onChange={handleChange}
							onBlur={() => handleBlur("company_name")}
							error={errors.company_name}
							grayWhenEmpty
							required
							fullWidth
						/>
					</Grid>

					<Grid item md={5.96} alignItems={"center"} gap={2}>
						<ContactTypeSelector
							small={false}
							isCustomer={!!formData.is_customer}
							isSupplier={!!formData.is_supplier}
							errorText={errors.is_customer || errors.is_supplier}
							onChange={({ is_customer, is_supplier }) =>
								setFormData((prev) => ({ ...prev, is_customer, is_supplier }))
							}
						/>
					</Grid>
				</Grid>
			</FormSection>

			<FormSection title="Adresa">
				<Grid container spacing={2}>
					<Grid item md={6}>
						<ValidatedTextField
							label="Ulice a číslo popisné"
							name="street"
							value={formData.street ?? ""}
							onChange={handleChange}
							onBlur={() => handleBlur("street")}
							error={errors.street}
							grayWhenEmpty
							fullWidth
						/>
					</Grid>
					<Grid item md={4}>
						<ValidatedTextField
							label="Město"
							name="city"
							value={formData.city ?? ""}
							onChange={handleChange}
							onBlur={() => handleBlur("city")}
							error={errors.city}
							grayWhenEmpty
						/>
					</Grid>
					<Grid item md={2}>
						<ValidatedTextField
							label="PSČ"
							name="postal_code"
							value={formData.postal_code ?? ""}
							onChange={handleChange}
							onBlur={() => handleBlur("postal_code")}
							error={errors.postal_code}
							grayWhenEmpty
						/>
					</Grid>
				</Grid>
			</FormSection>

			<FormSection title="Kontaktní údaje">
				<Grid container spacing={2}>
					<Grid item md={6}>
						<ValidatedTextField
							label="Telefon"
							name="phone"
							value={formData.phone ?? ""}
							onChange={handleChange}
							onBlur={() => handleBlur("phone")}
							error={errors.phone}
						/>
					</Grid>

					<Grid item md={6}>
						<ValidatedTextField
							label="E-mail"
							name="email"
							type="email"
							value={formData.email ?? ""}
							onChange={handleChange}
							onBlur={() => handleBlur("email")}
							error={errors.email}
						/>
					</Grid>

					<Grid item md={6}>
						<ValidatedTextField
							label="Kontaktní osoba"
							name="representative_name"
							value={formData.representative_name ?? ""}
							onChange={handleChange}
							onBlur={() => handleBlur("representative_name")}
							error={errors.representative_name}
							fullWidth
						/>
					</Grid>

					<Grid item md={6}>
						<ValidatedTextField
							label="Webové stránky"
							name="website"
							value={formData.website ?? ""}
							onChange={handleChange}
							onBlur={() => handleBlur("website")}
							error={errors.website}
							fullWidth
						/>
					</Grid>
				</Grid>
			</FormSection>

			<FormSection title="Finanční údaje" hideDivider>
				<Grid container spacing={2} alignItems="center">
					<Grid item xs={12} md={6}>
						<ValidatedTextField
							label="Číslo účtu"
							type="number"
							name="accountNumber"
							value={bankAccountParts.accountNumber}
							onChange={handleBankAccountChange("accountNumber")}
							onBlur={() => handleBlur("bank_account")}
							error={errors.bank_account}
							placeholder="123456789"
							fullWidth
						/>
					</Grid>

					<Grid item xs={12} md={3}>
						<ValidatedTextField
							type="number"
							label="Kód banky"
							name="bankCode"
							value={bankAccountParts.bankCode}
							onChange={handleBankAccountChange("bankCode")}
							onBlur={() => handleBlur("bank_account")}
							error={errors.bank_account}
							placeholder="0100"
							fullWidth
							showToolTip={false}
						/>
					</Grid>

					<Grid item xs={12} md={3}>
						<FormControl size="small" fullWidth>
							<InputLabel>Cenová skupina</InputLabel>
							<Select
								value={formData.price_group}
								label="Cenová skupina"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										price_group: Number(e.target.value),
									}))
								}
							>
								<MenuItem value={1}>Skupina 1</MenuItem>
								<MenuItem value={2}>Skupina 2</MenuItem>
								<MenuItem value={3}>Skupina 3</MenuItem>
								<MenuItem value={4}>Skupina 4</MenuItem>
							</Select>
						</FormControl>
					</Grid>
				</Grid>
			</FormSection>
		</FormDialog>
	);
}

export default ContactForm;