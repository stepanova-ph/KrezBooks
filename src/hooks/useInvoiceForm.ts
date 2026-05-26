import { useCallback, useEffect, useState } from "react";
import type { Contact, InvoiceType, Item } from "../types/database";
import { invoiceSchema } from "../validation/invoiceSchema";
import { useTabPersistence } from "../context/TabPersistanceContext";
import {
	DEFAULT_INVOICE_TYPE,
	DATE_TAX_OFFSET_DAYS,
	DATE_DUE_OFFSET_DAYS,
} from "../config/constants";
import { calculateItemTotals } from "../utils/invoiceCalculations";

export interface InvoiceItem extends Item {
	amount: number;
	sale_price: number;
	total: number;
	p_group_index: number;
}

export interface InvoiceFormData {
	number: string;
	prefix: string;
	type: InvoiceType;
	payment_method: number | undefined;
	date_issue: string;
	date_tax: string;
	date_due: string;
	variable_symbol: string;
	order_number: string;
	note: string;
	is_in_eur: boolean;
	ico: string;
	modifier: number | undefined;
	dic: string;
	company_name: string;
	bank_account: string;
	street: string;
	city: string;
	postal_code: string;
	phone: string;
	email: string;
}

/**
 * Calculate date by adding days to a base date
 */
function addDays(dateString: string, days: number): string {
	const date = new Date(dateString);
	date.setDate(date.getDate() + days);
	return date.toISOString().split("T")[0];
}

const getInitialDate = () => new Date().toISOString().split("T")[0];

const defaultFormData: InvoiceFormData = {
	number: "",
	prefix: "",
	type: DEFAULT_INVOICE_TYPE,
	payment_method: 1,
	date_issue: getInitialDate(),
	date_tax: addDays(getInitialDate(), DATE_TAX_OFFSET_DAYS),
	date_due: addDays(getInitialDate(), DATE_DUE_OFFSET_DAYS),
	variable_symbol: "",
	order_number: "",
	note: "",
	is_in_eur: false,
	ico: "",
	modifier: undefined,
	dic: "",
	company_name: "",
	bank_account: "",
	street: "",
	city: "",
	postal_code: "",
	phone: "",
	email: "",
};

export function useInvoiceForm() {
	const { invoiceFormState, setInvoiceFormState, clearInvoiceFormState } =
		useTabPersistence();

	const [formData, setFormData] = useState<InvoiceFormData>(
		invoiceFormState?.formData || defaultFormData,
	);

	const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>(
		invoiceFormState?.invoiceItems || [],
	);

	const [selectedContact, setSelectedContact] = useState<Contact | null>(
		invoiceFormState?.selectedContact || null,
	);

	const [errors, setErrors] = useState<Record<string, string>>({});

	const [isVariableSymbolCustom, setIsVariableSymbolCustom] = useState(false);
	const [isDateTaxManual, setIsDateTaxManual] = useState(false);
	const [isDateDueManual, setIsDateDueManual] = useState(false);

	// Auto-sync variable symbol
	useEffect(() => {
		if (!isVariableSymbolCustom) {
			const autoVariableSymbol = `${formData.prefix}${formData.number}`;
			if (formData.variable_symbol !== autoVariableSymbol) {
				console.log(`Auto-syncing variable symbol: ${autoVariableSymbol}`);
				setFormData((prev) => ({
					...prev,
					variable_symbol: autoVariableSymbol,
				}));
			}
		} else {
			console.log("Variable symbol is custom, not auto-syncing");
		}
	}, [formData.prefix, formData.number, isVariableSymbolCustom]);

	// Auto-calculate date_tax and date_due based on date_issue
	useEffect(() => {
		if (formData.date_issue) {
			const updates: Partial<InvoiceFormData> = {};

			// Auto-calculate date_tax if not manually set
			if (!isDateTaxManual) {
				const autoDateTax = addDays(formData.date_issue, DATE_TAX_OFFSET_DAYS);
				if (formData.date_tax !== autoDateTax) {
					updates.date_tax = autoDateTax;
				}
			}

			// Auto-calculate date_due if not manually set
			if (!isDateDueManual) {
				const autoDateDue = addDays(formData.date_issue, DATE_DUE_OFFSET_DAYS);
				if (formData.date_due !== autoDateDue) {
					updates.date_due = autoDateDue;
				}
			}

			if (Object.keys(updates).length > 0) {
				setFormData((prev) => ({ ...prev, ...updates }));
			}
		}
	}, [formData.date_issue, isDateTaxManual, isDateDueManual]);

	useEffect(() => {
		setInvoiceFormState({
			formData,
			invoiceItems,
			selectedContact,
		});
	}, [formData, invoiceItems, selectedContact, setInvoiceFormState]);

	const handleChange = useCallback((field: string, value: string | number | boolean) => {
		if (field === "variable_symbol") {
			setFormData((prev) => {
				const autoVariableSymbol = `${prev.prefix}${prev.number}`;
				if (value !== autoVariableSymbol) {
					setIsVariableSymbolCustom(true);
				} else {
					setIsVariableSymbolCustom(false);
				}
				return { ...prev, [field]: value };
			});
		} else {
			if (field === "date_tax") {
				setFormData((prev) => {
					const autoDateTax = addDays(prev.date_issue, DATE_TAX_OFFSET_DAYS);
					setIsDateTaxManual(value !== autoDateTax);
					return { ...prev, [field]: value };
				});
			} else if (field === "date_due") {
				setFormData((prev) => {
					const autoDateDue = addDays(prev.date_issue, DATE_DUE_OFFSET_DAYS);
					setIsDateDueManual(value !== autoDateDue);
					return { ...prev, [field]: value };
				});
			} else {
				setFormData((prev) => ({ ...prev, [field]: value }));
			}
		}

		setErrors((prev) => {
			if (prev[field]) {
				return { ...prev, [field]: "" };
			}
			return prev;
		});
	}, []);

	const handleBlur = (field: string) => {
		if (field === "variable_symbol" && !formData.variable_symbol.trim()) {
			const autoVariableSymbol = `${formData.prefix}${formData.number}`;
			console.log(
				`Variable symbol was empty, setting to default: ${autoVariableSymbol}`,
			);
			setFormData((prev) => ({
				...prev,
				variable_symbol: autoVariableSymbol,
			}));
			setIsVariableSymbolCustom(false);
		}

		const result = invoiceSchema.safeParse(formData);
		if (!result.success) {
			const fieldError = result.error.issues.find(
				(err) => err.path[0] === field,
			);
			if (fieldError) {
				setErrors((prev) => ({ ...prev, [field]: fieldError.message }));
			}
		}
	};

	const handleValidate = (): { valid: boolean; errors: Record<string, string> } => {
		const result = invoiceSchema.safeParse(formData);
		if (!result.success) {
			const fieldErrors: Record<string, string> = {};
			result.error.issues.forEach((err) => {
				if (typeof err.path[0] === "string") {
					fieldErrors[err.path[0]] = err.message;
				}
			});
			setErrors(fieldErrors);
			return { valid: false, errors: fieldErrors };
		}
		setErrors({});
		return { valid: true, errors: {} };
	};

	const handleReset = () => {
		// Persist header fields: dates, type, variable symbol, payment type
		const today = new Date().toISOString().split("T")[0];
		const newFormData: InvoiceFormData = {
			...defaultFormData,
			type: formData.type,
			payment_method: formData.payment_method,
			date_issue: today,
			date_tax: addDays(today, DATE_TAX_OFFSET_DAYS), // Auto-calculate immediately
			date_due: addDays(today, DATE_DUE_OFFSET_DAYS), // Auto-calculate immediately
			prefix: formData.prefix, // Keep prefix for same type
			number: "", // Clear number so it will be auto-filled by NewInvoiceTab
		};

		setFormData(newFormData);
		setInvoiceItems([]);
		setSelectedContact(null);
		setErrors({});
		setIsVariableSymbolCustom(false);
		setIsDateTaxManual(false); // Reset date manual flags
		setIsDateDueManual(false);
		clearInvoiceFormState();
	};

	const handleSelectContact = (contact: Contact) => {
		setSelectedContact(contact);
		setFormData((prev) => ({
			...prev,
			ico: contact.ico,
			modifier: contact.modifier,
			dic: contact.dic || "",
			company_name: contact.company_name,
			street: contact.street || "",
			city: contact.city || "",
			postal_code: contact.postal_code || "",
			phone: contact.phone || "",
			email: contact.email || "",
			bank_account: contact.bank_account || "",
		}));
	};

	const handleAddItem = (
		item: Item,
		amount: number,
		price: number,
		p_group_index: number,
	) => {
		// Calculate total with smart rounding applied per unit BEFORE multiplying by quantity
		const { totalWithVat: unitTotal } = calculateItemTotals(
			price,
			1,
			item.vat_rate,
		);

		const newItem: InvoiceItem = {
			...item,
			amount,
			sale_price: price,
			total: unitTotal * amount, // Smart rounded per unit × quantity
			p_group_index,
		};
		setInvoiceItems((prev) => [...prev, newItem]);
	};

	const handleUpdateItem = (
		index: number,
		item: Item,
		amount: number,
		price: number,
		p_group_index: number,
	) => {
		// Calculate total with smart rounding applied per unit BEFORE multiplying by quantity
		const { totalWithVat: unitTotal } = calculateItemTotals(
			price,
			1,
			item.vat_rate,
		);

		const updatedItem: InvoiceItem = {
			...item,
			amount,
			sale_price: price,
			total: unitTotal * amount, // Smart rounded per unit × quantity
			p_group_index,
		};
		setInvoiceItems((prev) => {
			const updated = [...prev];
			updated[index] = updatedItem;
			return updated;
		});
	};

	const handleDeleteItem = (item: InvoiceItem) => {
		setInvoiceItems((prev) => prev.filter((i) => i.ean !== item.ean));
	};

	return {
		formData,
		errors,
		invoiceItems,
		selectedContact,
		handleChange,
		handleBlur,
		handleValidate,
		handleReset,
		handleSelectContact,
		handleAddItem,
		handleUpdateItem,
		handleDeleteItem,
	};
}
