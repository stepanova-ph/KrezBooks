import { CreateInput, UpdateInput } from "./generic";

/**
 * VAT rate codes:
 * 0 = zero rate (0%)
 * 1 = basic rate (e.g., 21%)
 * 2 = reduced rate (e.g., 12%)
 */
export type VatRate = 0 | 1 | 2;

/**
 * Price group/tier (1-4)
 * Determines which sale_price_groupX the customer uses
 */
export type PriceGroup = 1 | 2 | 3 | 4;

/**
 * Contact - Companies and their branches
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
 * Item - Warehouse items with multi-tier pricing
 */
export interface Item {
  ean: string;
  category?: string
  name: string;
  note?: string;
  vat_rate: VatRate;
  avg_purchase_price: number;
  last_purchase_price: number;
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