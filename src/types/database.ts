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
  ico: string;                    // Company ID (primary key part 1)
  modifier: number;                // Branch modifier (primary key part 2)
  dic?: string;                    // Tax ID
  company_name: string;            // Company name
  representative_name?: string;    // Contact person
  street?: string;                 // Street address
  city?: string;                   // City
  postal_code?: string;            // Postal code
  is_supplier: boolean;            // Is this a supplier?
  is_customer: boolean;            // Is this a customer?
  price_group: PriceGroup;         // Which price tier (1-4)
  phone?: string;                  // Phone number
  email?: string;                  // Email
  website?: string;                // Website URL
  bank_account?: string;           // Bank account number
  created_at?: string;             // Timestamp
  updated_at?: string;             // Timestamp
}

export type CreateContactInput = CreateInput<Contact, 'created_at' | 'updated_at'>;
export type UpdateContactInput = UpdateInput<Contact, 'created_at' | 'updated_at', 'ico' | 'modifier'>;

/**
 * Item - Warehouse items with multi-tier pricing
 */
export interface Item {
  id: number;                      // Auto-increment primary key
  sales_group?: string;            // Product category/group
  name: string;                    // Item name
  note?: string;                   // Description/notes
  vat_rate: VatRate;               // VAT category (0, 1, 2)
  avg_purchase_price: number;      // Average purchase price (in cents)
  last_purchase_price: number;     // Last purchase price (in cents)
  unit_of_measure: string;         // e.g., 'ks', 'kg', 'l'
  sale_price_group1: number;       // Price tier 1 (in cents)
  sale_price_group2: number;       // Price tier 2 (in cents)
  sale_price_group3: number;       // Price tier 3 (in cents)
  sale_price_group4: number;       // Price tier 4 (in cents)
  created_at?: string;             // Timestamp
  updated_at?: string;             // Timestamp
}


export type CreateItemInput = CreateInput<Item, 'id' | 'created_at' | 'updated_at'>;
export type UpdateItemInput = UpdateInput<Item, 'created_at' | 'updated_at', 'id'>;