import { Contact } from "src/types/database";

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
	value: number | null | undefined,
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