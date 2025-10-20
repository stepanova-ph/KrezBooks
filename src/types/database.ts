import { CreateInput, UpdateInput } from "./generic";
import { VAT_RATES, PRICE_GROUPS, INVOICE_TYPES } from "src/config/constants";

export type VatRate = keyof typeof VAT_RATES;

export type PriceGroup = (typeof PRICE_GROUPS)[number];

export type InvoiceType = keyof typeof INVOICE_TYPES;

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
  category?: string
  name: string;
  note?: string;
  vat_rate: VatRate;
  unit_of_measure: string;
  sale_price_group1: number;
  sale_price_group2: number;
  sale_price_group3: number;
  sale_price_group4: number;
  created_at?: string;
  updated_at?: string;
}

export type CreateItemInput = CreateInput<
  Item,
  "created_at" | "updated_at"
>;

export type UpdateItemInput = UpdateInput<
  Item,
  "created_at" | "updated_at",
  "ean"
>;

/**
 * StockMovement
 */
export interface StockMovement {
  invoice_number: string;
  item_ean: string;
  amount: string;
  price_per_unit: string;
  created_at?: string;
}

export type CreateStockMovementInput = CreateInput<
  StockMovement,
  "created_at"
>;

export type UpdateStockMovementInput = UpdateInput<
  StockMovement,
  "created_at",
  "invoice_number" | "item_ean"
>;

/**
 * Invoice - with frozen contact snapshot
 */
export interface Invoice {
  number: string;
  type: InvoiceType;
  date_issue: string;
  date_tax: string;
  date_due: string;
  variable_symbol: string;
  note?: string;

  ico: string;
  modifier: number;
  dic?: string;
  company_name: string;
  price_group: PriceGroup;
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