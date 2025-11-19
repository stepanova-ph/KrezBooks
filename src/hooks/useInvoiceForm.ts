import { useEffect, useState } from "react";
import type { Contact, InvoiceType, Item } from "../types/database";
import { invoiceSchema } from "../validation/invoiceSchema";
import { useTabPersistence } from "../context/TabPersistanceContext";

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
	note: string;
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

const defaultFormData: InvoiceFormData = {
	number: "",
	prefix: "",
	type: 1,
	payment_method: undefined,
	date_issue: new Date().toISOString().split("T")[0],
	date_tax: "",
	date_due: "",
	variable_symbol: "",
	note: "",
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

	// Track if variable symbol has been manually edited by user
	const [isVariableSymbolCustom, setIsVariableSymbolCustom] = useState(false);

	// Auto-sync variable symbol with prefix + number (unless user has customized it)
	useEffect(() => {
		if (!isVariableSymbolCustom) {
			const autoVariableSymbol = `${formData.prefix}${formData.number}`;
			if (formData.variable_symbol !== autoVariableSymbol) {
				setFormData((prev) => ({
					...prev,
					variable_symbol: autoVariableSymbol,
				}));
			}
		}
	}, [formData.prefix, formData.number, isVariableSymbolCustom]);

	useEffect(() => {
		setInvoiceFormState({
			formData,
			invoiceItems,
			selectedContact,
		});
	}, [formData, invoiceItems, selectedContact, setInvoiceFormState]);

	const handleChange = (field: string, value: string | number) => {
		// Update form data first
		setFormData((prev) => ({ ...prev, [field]: value }));

		// Detect manual edit of variable symbol
		if (field === "variable_symbol") {
			// Calculate what the auto variable symbol would be with current prefix/number
			const autoVariableSymbol = `${formData.prefix}${formData.number}`;
			// If user enters something different than auto, mark as custom
			if (value !== autoVariableSymbol) {
				setIsVariableSymbolCustom(true);
			} else {
				// If they change it back to match, it's no longer custom
				setIsVariableSymbolCustom(false);
			}
		}

		// When prefix or number changes, allow auto-sync to take over
		if (field === "prefix" || field === "number") {
			setIsVariableSymbolCustom(false);
		}

		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	const handleBlur = (field: string) => {
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

	const handleValidate = (): boolean => {
		const result = invoiceSchema.safeParse(formData);
		if (!result.success) {
			const fieldErrors: Record<string, string> = {};
			result.error.issues.forEach((err) => {
				if (typeof err.path[0] === "string") {
					fieldErrors[err.path[0]] = err.message;
				}
			});
			setErrors(fieldErrors);
			return false;
		}
		setErrors({});
		return true;
	};

	const handleReset = () => {
		setFormData(defaultFormData);
		setInvoiceItems([]);
		setSelectedContact(null);
		setErrors({});
		setIsVariableSymbolCustom(false);
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
		const newItem: InvoiceItem = {
			...item,
			amount,
			sale_price: price,
			total: amount * price,
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
		const updatedItem: InvoiceItem = {
			...item,
			amount,
			sale_price: price,
			total: amount * price,
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
