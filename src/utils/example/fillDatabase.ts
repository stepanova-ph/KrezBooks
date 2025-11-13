import type Database from "better-sqlite3";
import { exampleContacts } from "./contacts";
import { exampleItems } from "./items";
import { exampleInvoices } from "./invoices";
import {
	contactQueries,
	invoiceQueries,
	itemQueries,
	stockMovementQueries,
} from "../../main/queries";
import { exampleStockMovements } from "./stockMovements";
import { booleanToSQLiteInteger } from "../typeConverterUtils";
// import { exampleInvoices } from './invoices';
// import { exampleStockMovements } from './stockMovements';

interface FillResult {
	contactsAdded: number;
	itemsAdded: number;
	invoicesAdded: number;
	stockMovementsAdded: number;
	errors: string[];
}

/**
 * Fill database with test data
 */
export function fillTestData(db: Database.Database): FillResult {
	let contactsAdded = 0;
	let itemsAdded = 0;
	let invoicesAdded = 0;
	let stockMovementsAdded = 0;
	const errors: string[] = [];

	// Insert contacts
	const insertContact = db.prepare(contactQueries.create);

	for (const contact of exampleContacts) {
		try {
			insertContact.run({
				ico: contact.ico,
				modifier: contact.modifier,
				dic: contact.dic || null,
				company_name: contact.company_name,
				representative_name: contact.representative_name || null,
				street: contact.street || null,
				city: contact.city || null,
				postal_code: contact.postal_code || null,
				phone: contact.phone || null,
				email: contact.email || null,
				website: contact.website || null,
				bank_account: contact.bank_account || null,
				is_supplier: contact.is_supplier ? 1 : 0,
				is_customer: contact.is_customer ? 1 : 0,
				price_group: contact.price_group,
			});
			contactsAdded++;
		} catch (error: any) {
			errors.push(`Contact ${contact.company_name}: ${error.message}`);
		}
	}

	// Insert items
	const insertItem = db.prepare(itemQueries.create);

	for (const item of exampleItems) {
		try {
			insertItem.run({
				ean: item.ean,
				name: item.name,
				category: item.category || null,
				note: item.note || null,
				vat_rate: item.vat_rate,
				unit_of_measure: item.unit_of_measure,
				sale_price_group1: item.sale_price_group1,
				sale_price_group2: item.sale_price_group2,
				sale_price_group3: item.sale_price_group3,
				sale_price_group4: item.sale_price_group4,
			});
			itemsAdded++;
		} catch (error: any) {
			errors.push(`Item ${item.name}: ${error.message}`);
		}
	}

	const insertInvoice = db.prepare(invoiceQueries.create);

	for (const invoice of exampleInvoices) {
		try {
			insertInvoice.run({
				number: invoice.number,
				prefix: invoice.prefix || null,
				type: invoice.type,
				payment_method: invoice.payment_method,
				date_issue: invoice.date_issue,
				date_tax: invoice.date_tax,
				date_due: invoice.date_due,
				variable_symbol: invoice.variable_symbol,
				note: invoice.note,

				ico: invoice.ico,
				modifier: invoice.modifier,
				dic: invoice.dic,
				company_name: invoice.company_name,
				bank_account: invoice.bank_account,
				street: invoice.street,
				city: invoice.city,
				postal_code: invoice.postal_code,
				phone: invoice.phone,
				email: invoice.email,
			});
			invoicesAdded++;
		} catch (error: any) {
			errors.push(`Invoice ${invoice.number}: ${error.message}`);
		}
	}

	const insertStockMovement = db.prepare(stockMovementQueries.create);

	for (const movement of exampleStockMovements) {
		try {
			insertStockMovement.run({
				invoice_number: movement.invoice_number,
				item_ean: movement.item_ean,
				amount: movement.amount,
				price_per_unit: movement.price_per_unit,
				vat_rate: movement.vat_rate,
				reset_point: booleanToSQLiteInteger(movement.reset_point ?? false),
			});
			stockMovementsAdded++;
		} catch (error: any) {
			errors.push(
				`Stock movement ${movement.invoice_number}: ${error.message}`,
			);
		}
	}

	return {
		contactsAdded,
		itemsAdded,
		invoicesAdded,
		stockMovementsAdded,
		errors,
	};
}
