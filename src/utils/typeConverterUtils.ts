import { Contact, Invoice, Item, StockMovement } from "src/types/database";

/**
 * Convert TypeScript boolean to SQLite integer (0/1)
 * SQLite doesn't have a native boolean type, so we use integers
 */
export function booleanToSQLiteInteger(value: boolean): number {
	return value ? 1 : 0;
}

/**
 * Convert SQLite integer (0/1) to TypeScript boolean
 * Handles any truthy/falsy value for robustness
 */
export function sqliteIntegerToBoolean(
	value: number | undefined | null,
): boolean {
	return Boolean(value);
}

/**
 * Convert contact from database format to TypeScript format
 */
export function deserializeContact(dbContact: any): Contact {
	return {
		...dbContact,
		is_supplier: sqliteIntegerToBoolean(dbContact.is_supplier),
		is_customer: sqliteIntegerToBoolean(dbContact.is_customer),
	};
}

/**
 * Convert contact from TypeScript format to database format
 */
export function serializeContact(contact: Partial<Contact>): any {
	const result = {
		ico: contact.ico ?? null,
		modifier: contact.modifier ?? null,
		dic: contact.dic ?? null,
		company_name: contact.company_name ?? null,
		representative_name: contact.representative_name ?? null,
		street: contact.street ?? null,
		city: contact.city ?? null,
		postal_code: contact.postal_code ?? null,
		phone: contact.phone ?? null,
		email: contact.email ?? null,
		website: contact.website ?? null,
		bank_account: contact.bank_account ?? null,
		is_supplier: "is_supplier" in contact 
			? booleanToSQLiteInteger(contact.is_supplier as boolean)
			: null,
		is_customer: "is_customer" in contact
			? booleanToSQLiteInteger(contact.is_customer as boolean)
			: null,
		price_group: contact.price_group ?? null,
	};
	
	return result;
}

export function serializeItem(item: Partial<Item>): any {
	const result = {
		ean: item.ean ?? null,
		category: item.category ?? null,
		name: item.name ?? null,
		note: item.note ?? null,
		vat_rate: item.vat_rate ?? null,
		unit_of_measure: item.unit_of_measure ?? null,
		sale_price_group1: item.sale_price_group1 ?? null,
		sale_price_group2: item.sale_price_group2 ?? null,
		sale_price_group3: item.sale_price_group3 ?? null,
		sale_price_group4: item.sale_price_group4 ?? null,
	}

	return result
}

export function serializeStockMovement(movement: Partial<StockMovement>): any {
  return {
    invoice_number: movement.invoice_number ?? null,
    item_ean: movement.item_ean ?? null,
    amount: movement.amount ?? null,
    price_per_unit: movement.price_per_unit ?? null,
    vat_rate: movement.vat_rate ?? null,
  };
}

export function serializeInvoice(invoice: Partial<Invoice>): any {
  return {
    number: invoice.number ?? null,
    type: invoice.type ?? null,
    payment_method: invoice.payment_method ?? null,
    date_issue: invoice.date_issue ?? null,
    date_tax: invoice.date_tax ?? null,
    date_due: invoice.date_due ?? null,
    variable_symbol: invoice.variable_symbol ?? null,
    note: invoice.note ?? null,
    ico: invoice.ico ?? null,
    modifier: invoice.modifier ?? null,
    dic: invoice.dic ?? null,
    company_name: invoice.company_name ?? null,
    bank_account: invoice.bank_account ?? null,
    street: invoice.street ?? null,
    city: invoice.city ?? null,
    postal_code: invoice.postal_code ?? null,
    phone: invoice.phone ?? null,
    email: invoice.email ?? null,
  };
}