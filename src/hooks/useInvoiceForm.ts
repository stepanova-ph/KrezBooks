import { useState } from "react";
import type { Contact, InvoiceType, Item } from "../types/database";
import { invoiceSchema } from "../validation/invoiceSchema";

export interface InvoiceItem extends Item {
  amount: number;
  sale_price: number;
  total: number;
  p_group_index: number;
}

interface InvoiceFormData {
  number: string;
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
  const [formData, setFormData] = useState<InvoiceFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleBlur = (field: string) => {
    const result = invoiceSchema.safeParse(formData);
    if (!result.success) {
      const fieldError = result.error.issues.find(
        (err) => err.path[0] === field
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
    p_group_index: number
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
    p_group_index: number
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