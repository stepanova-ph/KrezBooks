import { CreateInput, UpdateInput } from "./generic";
import {
	VAT_RATES,
	PRICE_GROUPS,
	INVOICE_TYPES,
	PAYMENT_METHOD_TYPES,
} from "src/config/constants";

export type VatRate = (typeof VAT_RATES)[number]["value"]; // → 0 | 1 | 2

export type PriceGroup = (typeof PRICE_GROUPS)[number];

export type InvoiceType = keyof typeof INVOICE_TYPES;

export type PaymentMethodType = keyof typeof PAYMENT_METHOD_TYPES;

/**
 * Contact
 */
export interface Contact {
	ico: string;
	modifier: number;
	dic?: string;
	company_name: string;
	representative_name?: string;
	street?: string;
	city?: string;
	postal_code?: string;
	is_supplier: boolean;
	is_customer: boolean;
	price_group: PriceGroup;
	phone?: string;
	email?: string;
	website?: string;
	bank_account?: string;

	total_without_vat?: number;
	total_with_vat?: number;

	created_at?: string;
	updated_at?: string;
}

export type CreateContactInput = CreateInput<
	Contact,
	"created_at" | "updated_at"
>;
export type UpdateContactInput = UpdateInput<
	Contact,
	"created_at" | "updated_at",
	"ico" | "modifier"
>;

/**
 * Item
 */
export interface Item {
	ean: string;
	category?: string;
	name: string;
	note?: string;
	vat_rate: VatRate;
	unit_of_measure: string;
	sale_price_group1: number;
	sale_price_group2: number;
	sale_price_group3: number;
	sale_price_group4: number;
	stock_amount?: number;
	created_at?: string;
	updated_at?: string;
}

export type CreateItemInput = CreateInput<Item, "created_at" | "updated_at">;

export type UpdateItemInput = UpdateInput<
	Item,
	"created_at" | "updated_at",
	"ean"
>;

/**
 * StockMovement
 */
export interface StockMovement {
	invoice_prefix: string;
	invoice_number: string;
	item_ean: string;
	amount: number;
	price_per_unit: number;
	vat_rate: VatRate;
	reset_point?: boolean;
	created_at?: string;
}

export type CreateStockMovementInput = CreateInput<StockMovement, "created_at">;

export type UpdateStockMovementInput = UpdateInput<
	StockMovement,
	"created_at",
	"invoice_prefix" | "invoice_number" | "item_ean"
>;

/**
 * Invoice
 *
 * IMPORTANT: for real invoices (type 1-4), ico, modifier and company name is required
 *
 */
export interface Invoice {
	number: string;
	prefix: string;
	type: InvoiceType;
	payment_method?: PaymentMethodType;
	date_issue: string;
	date_tax?: string;
	date_due?: string;
	variable_symbol?: string;
	note?: string;
	total_without_vat?: number;
	total_with_vat?: number;

	ico?: string;
	modifier?: number;
	dic?: string;
	company_name?: string;
	bank_account?: string;
	street?: string;
	city?: string;
	postal_code?: string;
	phone?: string;
	email?: string;
	created_at?: string;
	updated_at?: string;
}

export type CreateInvoiceInput = CreateInput<
	Invoice,
	"created_at" | "updated_at"
>;

export type UpdateInvoiceInput = UpdateInput<
	Invoice,
	"created_at" | "updated_at",
	"number"
>;

export interface StockMovementWithInvoiceInfo extends StockMovement {
	date_issue: string;
	invoice_type: number;
	contact_ico: string | null;
}
