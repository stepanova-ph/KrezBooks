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
	const result = { ...contact };
	if ("is_supplier" in result) {
		result.is_supplier = booleanToSQLiteInteger(
			result.is_supplier as boolean,
		) as any;
	}
	if ("is_customer" in result) {
		result.is_customer = booleanToSQLiteInteger(
			result.is_customer as boolean,
		) as any;
	}
	return result;
}
