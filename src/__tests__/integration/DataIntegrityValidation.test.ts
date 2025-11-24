import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { invoiceQueries } from "../../main/queries/invoices";
import { itemQueries } from "../../main/queries/items";
import { stockMovementQueries } from "../../main/queries/stockMovements";
import { contactQueries } from "../../main/queries/contacts";

describe("Data Integrity & Validation", () => {
	let db: Database.Database;

	beforeEach(() => {
		db = new Database(":memory:");
		db.exec(contactQueries.createTable);
		db.exec(itemQueries.createTable);
		db.exec(invoiceQueries.createTable);
		db.exec(stockMovementQueries.createTable);
	});

	afterEach(() => {
		db.close();
	});

	describe("NOT NULL Constraints", () => {
		describe("Invoices", () => {
			it("should enforce NOT NULL on prefix", () => {
				expect(() => {
					db.prepare(invoiceQueries.create).run({
						prefix: null,
						number: "001",
						type: 1,
						date_issue: "2024-01-15",
						payment_method: null,
						date_tax: null,
						date_due: null,
						variable_symbol: null,
						note: null,
						ico: null,
						modifier: null,
						dic: null,
						company_name: null,
						bank_account: null,
						street: null,
						city: null,
						postal_code: null,
						phone: null,
						email: null,
					});
				}).toThrow(/NOT NULL constraint failed: invoices\.prefix/);
			});

			it("should enforce NOT NULL on number", () => {
				expect(() => {
					db.prepare(invoiceQueries.create).run({
						prefix: "INV",
						number: null,
						type: 1,
						date_issue: "2024-01-15",
						payment_method: null,
						date_tax: null,
						date_due: null,
						variable_symbol: null,
						note: null,
						ico: null,
						modifier: null,
						dic: null,
						company_name: null,
						bank_account: null,
						street: null,
						city: null,
						postal_code: null,
						phone: null,
						email: null,
					});
				}).toThrow(/NOT NULL constraint failed: invoices\.number/);
			});

			it("should enforce NOT NULL on type", () => {
				expect(() => {
					db.prepare(invoiceQueries.create).run({
						prefix: "INV",
						number: "001",
						type: null,
						date_issue: "2024-01-15",
						payment_method: null,
						date_tax: null,
						date_due: null,
						variable_symbol: null,
						note: null,
						ico: null,
						modifier: null,
						dic: null,
						company_name: null,
						bank_account: null,
						street: null,
						city: null,
						postal_code: null,
						phone: null,
						email: null,
					});
				}).toThrow(/NOT NULL constraint failed: invoices\.type/);
			});

			it("should enforce NOT NULL on date_issue", () => {
				expect(() => {
					db.prepare(invoiceQueries.create).run({
						prefix: "INV",
						number: "001",
						type: 1,
						date_issue: null,
						payment_method: null,
						date_tax: null,
						date_due: null,
						variable_symbol: null,
						note: null,
						ico: null,
						modifier: null,
						dic: null,
						company_name: null,
						bank_account: null,
						street: null,
						city: null,
						postal_code: null,
						phone: null,
						email: null,
					});
				}).toThrow(/NOT NULL constraint failed: invoices\.date_issue/);
			});
		});

		describe("Items", () => {
			it("should enforce NOT NULL on ean", () => {
				expect(() => {
					db.prepare(itemQueries.create).run({
						ean: null,
						category: null,
						name: "Test Item",
						note: null,
						vat_rate: 1,
						unit_of_measure: "ks",
						sale_price_group1: "100",
						sale_price_group2: "100",
						sale_price_group3: "100",
						sale_price_group4: "100",
					});
				}).toThrow(/NOT NULL constraint failed: items\.ean/);
			});

			it("should enforce NOT NULL on name", () => {
				expect(() => {
					db.prepare(itemQueries.create).run({
						ean: "1234567890123",
						category: null,
						name: null,
						note: null,
						vat_rate: 1,
						unit_of_measure: "ks",
						sale_price_group1: "100",
						sale_price_group2: "100",
						sale_price_group3: "100",
						sale_price_group4: "100",
					});
				}).toThrow(/NOT NULL constraint failed: items\.name/);
			});

			it("should enforce NOT NULL on vat_rate", () => {
				expect(() => {
					db.prepare(itemQueries.create).run({
						ean: "1234567890123",
						category: null,
						name: "Test Item",
						note: null,
						vat_rate: null,
						unit_of_measure: "ks",
						sale_price_group1: "100",
						sale_price_group2: "100",
						sale_price_group3: "100",
						sale_price_group4: "100",
					});
				}).toThrow(/NOT NULL constraint failed: items\.vat_rate/);
			});

			it("should enforce NOT NULL on unit_of_measure", () => {
				expect(() => {
					db.prepare(itemQueries.create).run({
						ean: "1234567890123",
						category: null,
						name: "Test Item",
						note: null,
						vat_rate: 1,
						unit_of_measure: null,
						sale_price_group1: "100",
						sale_price_group2: "100",
						sale_price_group3: "100",
						sale_price_group4: "100",
					});
				}).toThrow(/NOT NULL constraint failed: items\.unit_of_measure/);
			});
		});

		describe("Stock Movements", () => {
			beforeEach(() => {
				db.prepare(invoiceQueries.create).run({
					prefix: "INV",
					number: "001",
					type: 1,
					date_issue: "2024-01-15",
					payment_method: null,
					date_tax: null,
					date_due: null,
					variable_symbol: null,
					note: null,
					ico: null,
					modifier: null,
					dic: null,
					company_name: null,
					bank_account: null,
					street: null,
					city: null,
					postal_code: null,
					phone: null,
					email: null,
				});

				db.prepare(itemQueries.create).run({
					ean: "1234567890123",
					category: null,
					name: "Test Item",
					note: null,
					vat_rate: 1,
					unit_of_measure: "ks",
					sale_price_group1: "100",
					sale_price_group2: "100",
					sale_price_group3: "100",
					sale_price_group4: "100",
				});
			});

			it("should enforce NOT NULL on invoice_prefix", () => {
				expect(() => {
					db.prepare(stockMovementQueries.create).run({
						invoice_prefix: null,
						invoice_number: "001",
						item_ean: "1234567890123",
						amount: "10",
						price_per_unit: "50.00",
						vat_rate: 1,
						reset_point: 0,
					});
				}).toThrow(/NOT NULL constraint failed: stock_movements\.invoice_prefix/);
			});

			it("should enforce NOT NULL on invoice_number", () => {
				expect(() => {
					db.prepare(stockMovementQueries.create).run({
						invoice_prefix: "INV",
						invoice_number: null,
						item_ean: "1234567890123",
						amount: "10",
						price_per_unit: "50.00",
						vat_rate: 1,
						reset_point: 0,
					});
				}).toThrow(/NOT NULL constraint failed: stock_movements\.invoice_number/);
			});

			it("should enforce NOT NULL on item_ean", () => {
				expect(() => {
					db.prepare(stockMovementQueries.create).run({
						invoice_prefix: "INV",
						invoice_number: "001",
						item_ean: null,
						amount: "10",
						price_per_unit: "50.00",
						vat_rate: 1,
						reset_point: 0,
					});
				}).toThrow(/NOT NULL constraint failed: stock_movements\.item_ean/);
			});

			it("should enforce NOT NULL on amount", () => {
				expect(() => {
					db.prepare(stockMovementQueries.create).run({
						invoice_prefix: "INV",
						invoice_number: "001",
						item_ean: "1234567890123",
						amount: null,
						price_per_unit: "50.00",
						vat_rate: 1,
						reset_point: 0,
					});
				}).toThrow(/NOT NULL constraint failed: stock_movements\.amount/);
			});

			it("should enforce NOT NULL on price_per_unit", () => {
				expect(() => {
					db.prepare(stockMovementQueries.create).run({
						invoice_prefix: "INV",
						invoice_number: "001",
						item_ean: "1234567890123",
						amount: "10",
						price_per_unit: null,
						vat_rate: 1,
						reset_point: 0,
					});
				}).toThrow(/NOT NULL constraint failed: stock_movements\.price_per_unit/);
			});
		});

		describe("Contacts", () => {
			it("should enforce NOT NULL on ico", () => {
				expect(() => {
					db.prepare(contactQueries.create).run({
						ico: null,
						modifier: 1,
						dic: null,
						company_name: "Test Company",
						representative_name: null,
						street: null,
						city: null,
						postal_code: null,
						is_supplier: 1,
						is_customer: 0,
						price_group: null,
						phone: null,
						email: null,
						website: null,
						bank_account: null,
					});
				}).toThrow(/NOT NULL constraint failed: contacts\.ico/);
			});

			it("should enforce NOT NULL on modifier", () => {
				expect(() => {
					db.prepare(contactQueries.create).run({
						ico: "12345678",
						modifier: null,
						dic: null,
						company_name: "Test Company",
						representative_name: null,
						street: null,
						city: null,
						postal_code: null,
						is_supplier: 1,
						is_customer: 0,
						price_group: null,
						phone: null,
						email: null,
						website: null,
						bank_account: null,
					});
				}).toThrow(/NOT NULL constraint failed: contacts\.modifier/);
			});

			it("should enforce NOT NULL on is_supplier", () => {
				expect(() => {
					db.prepare(contactQueries.create).run({
						ico: "12345678",
						modifier: 1,
						dic: null,
						company_name: "Test Company",
						representative_name: null,
						street: null,
						city: null,
						postal_code: null,
						is_supplier: null,
						is_customer: 0,
						price_group: null,
						phone: null,
						email: null,
						website: null,
						bank_account: null,
					});
				}).toThrow(/NOT NULL constraint failed: contacts\.is_supplier/);
			});

			it("should enforce NOT NULL on is_customer", () => {
				expect(() => {
					db.prepare(contactQueries.create).run({
						ico: "12345678",
						modifier: 1,
						dic: null,
						company_name: "Test Company",
						representative_name: null,
						street: null,
						city: null,
						postal_code: null,
						is_supplier: 1,
						is_customer: null,
						price_group: null,
						phone: null,
						email: null,
						website: null,
						bank_account: null,
					});
				}).toThrow(/NOT NULL constraint failed: contacts\.is_customer/);
			});
		});
	});

	describe("CHECK Constraints", () => {
		it("should enforce invoice type between 1 and 5", () => {
			expect(() => {
				db.prepare(invoiceQueries.create).run({
					prefix: "INV",
					number: "001",
					type: 0,
					date_issue: "2024-01-15",
					payment_method: null,
					date_tax: null,
					date_due: null,
					variable_symbol: null,
					note: null,
					ico: null,
					modifier: null,
					dic: null,
					company_name: null,
					bank_account: null,
					street: null,
					city: null,
					postal_code: null,
					phone: null,
					email: null,
				});
			}).toThrow(/CHECK constraint failed/);

			expect(() => {
				db.prepare(invoiceQueries.create).run({
					prefix: "INV",
					number: "001",
					type: 6,
					date_issue: "2024-01-15",
					payment_method: null,
					date_tax: null,
					date_due: null,
					variable_symbol: null,
					note: null,
					ico: null,
					modifier: null,
					dic: null,
					company_name: null,
					bank_account: null,
					street: null,
					city: null,
					postal_code: null,
					phone: null,
					email: null,
				});
			}).toThrow(/CHECK constraint failed/);
		});

		it("should enforce vat_rate between 0 and 2 in items", () => {
			expect(() => {
				db.prepare(itemQueries.create).run({
					ean: "1234567890123",
					category: null,
					name: "Test Item",
					note: null,
					vat_rate: -1,
					unit_of_measure: "ks",
					sale_price_group1: "100",
					sale_price_group2: "100",
					sale_price_group3: "100",
					sale_price_group4: "100",
				});
			}).toThrow(/CHECK constraint failed/);

			expect(() => {
				db.prepare(itemQueries.create).run({
					ean: "1234567890123",
					category: null,
					name: "Test Item",
					note: null,
					vat_rate: 3,
					unit_of_measure: "ks",
					sale_price_group1: "100",
					sale_price_group2: "100",
					sale_price_group3: "100",
					sale_price_group4: "100",
				});
			}).toThrow(/CHECK constraint failed/);
		});

		it("should enforce price_group between 1 and 4 in contacts", () => {
			expect(() => {
				db.prepare(contactQueries.create).run({
					ico: "12345678",
					modifier: 1,
					dic: null,
					company_name: "Test Company",
					representative_name: null,
					street: null,
					city: null,
					postal_code: null,
					is_supplier: 1,
					is_customer: 0,
					price_group: 0,
					phone: null,
					email: null,
					website: null,
					bank_account: null,
				});
			}).toThrow(/CHECK constraint failed/);

			expect(() => {
				db.prepare(contactQueries.create).run({
					ico: "12345678",
					modifier: 1,
					dic: null,
					company_name: "Test Company",
					representative_name: null,
					street: null,
					city: null,
					postal_code: null,
					is_supplier: 1,
					is_customer: 0,
					price_group: 5,
					phone: null,
					email: null,
					website: null,
					bank_account: null,
				});
			}).toThrow(/CHECK constraint failed/);
		});
	});

	describe("EAN Validation", () => {
		it("should accept valid 13-digit EAN", () => {
			db.prepare(itemQueries.create).run({
				ean: "1234567890123",
				category: null,
				name: "Test Item",
				note: null,
				vat_rate: 1,
				unit_of_measure: "ks",
				sale_price_group1: "100",
				sale_price_group2: "100",
				sale_price_group3: "100",
				sale_price_group4: "100",
			});

			const item = db.prepare("SELECT * FROM items WHERE ean = ?").get("1234567890123");
			expect(item).toBeDefined();
		});

		it("should accept EAN with varying lengths", () => {
			// 8-digit EAN-8
			db.prepare(itemQueries.create).run({
				ean: "12345678",
				category: null,
				name: "Item 1",
				note: null,
				vat_rate: 1,
				unit_of_measure: "ks",
				sale_price_group1: "100",
				sale_price_group2: "100",
				sale_price_group3: "100",
				sale_price_group4: "100",
			});

			// 13-digit EAN-13
			db.prepare(itemQueries.create).run({
				ean: "1234567890123",
				category: null,
				name: "Item 2",
				note: null,
				vat_rate: 1,
				unit_of_measure: "ks",
				sale_price_group1: "100",
				sale_price_group2: "100",
				sale_price_group3: "100",
				sale_price_group4: "100",
			});

			const items = db.prepare("SELECT * FROM items").all();
			expect(items.length).toBe(2);
		});

		it("should handle custom SKU codes", () => {
			db.prepare(itemQueries.create).run({
				ean: "SKU-001-A",
				category: null,
				name: "Custom Item",
				note: null,
				vat_rate: 1,
				unit_of_measure: "ks",
				sale_price_group1: "100",
				sale_price_group2: "100",
				sale_price_group3: "100",
				sale_price_group4: "100",
			});

			const item = db.prepare("SELECT * FROM items WHERE ean = ?").get("SKU-001-A");
			expect(item).toBeDefined();
		});
	});

	describe("Foreign Key Integrity", () => {
		it("should prevent orphaned stock movements when invoice is deleted", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "001",
				type: 1,
				date_issue: "2024-01-15",
				payment_method: null,
				date_tax: null,
				date_due: null,
				variable_symbol: null,
				note: null,
				ico: null,
				modifier: null,
				dic: null,
				company_name: null,
				bank_account: null,
				street: null,
				city: null,
				postal_code: null,
				phone: null,
				email: null,
			});

			db.prepare(itemQueries.create).run({
				ean: "1234567890123",
				category: null,
				name: "Test Item",
				note: null,
				vat_rate: 1,
				unit_of_measure: "ks",
				sale_price_group1: "100",
				sale_price_group2: "100",
				sale_price_group3: "100",
				sale_price_group4: "100",
			});

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "50.00",
				vat_rate: 1,
				reset_point: 0,
			});

			db.pragma("foreign_keys = ON");

			// Delete invoice - should cascade to stock movements
			db.prepare("DELETE FROM invoices WHERE prefix = ? AND number = ?").run("INV", "001");

			const movements = db.prepare("SELECT * FROM stock_movements").all();
			expect(movements.length).toBe(0);
		});

		it("should prevent deleting item with existing stock movements (RESTRICT)", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "001",
				type: 1,
				date_issue: "2024-01-15",
				payment_method: null,
				date_tax: null,
				date_due: null,
				variable_symbol: null,
				note: null,
				ico: null,
				modifier: null,
				dic: null,
				company_name: null,
				bank_account: null,
				street: null,
				city: null,
				postal_code: null,
				phone: null,
				email: null,
			});

			db.prepare(itemQueries.create).run({
				ean: "1234567890123",
				category: null,
				name: "Test Item",
				note: null,
				vat_rate: 1,
				unit_of_measure: "ks",
				sale_price_group1: "100",
				sale_price_group2: "100",
				sale_price_group3: "100",
				sale_price_group4: "100",
			});

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "50.00",
				vat_rate: 1,
				reset_point: 0,
			});

			db.pragma("foreign_keys = ON");

			// Delete item - should fail due to RESTRICT constraint
			expect(() => {
				db.prepare("DELETE FROM items WHERE ean = ?").run("1234567890123");
			}).toThrow(/FOREIGN KEY constraint failed/);
		});

		it("should prevent creating stock movement with non-existent invoice", () => {
			db.prepare(itemQueries.create).run({
				ean: "1234567890123",
				category: null,
				name: "Test Item",
				note: null,
				vat_rate: 1,
				unit_of_measure: "ks",
				sale_price_group1: "100",
				sale_price_group2: "100",
				sale_price_group3: "100",
				sale_price_group4: "100",
			});

			expect(() => {
				db.pragma("foreign_keys = ON");
				db.prepare(stockMovementQueries.create).run({
					invoice_prefix: "INV",
					invoice_number: "999",
					item_ean: "1234567890123",
					amount: "10",
					price_per_unit: "50.00",
					vat_rate: 1,
					reset_point: 0,
				});
			}).toThrow(/FOREIGN KEY constraint failed/);
		});

		it("should prevent creating stock movement with non-existent item", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "001",
				type: 1,
				date_issue: "2024-01-15",
				payment_method: null,
				date_tax: null,
				date_due: null,
				variable_symbol: null,
				note: null,
				ico: null,
				modifier: null,
				dic: null,
				company_name: null,
				bank_account: null,
				street: null,
				city: null,
				postal_code: null,
				phone: null,
				email: null,
			});

			expect(() => {
				db.pragma("foreign_keys = ON");
				db.prepare(stockMovementQueries.create).run({
					invoice_prefix: "INV",
					invoice_number: "001",
					item_ean: "9999999999999",
					amount: "10",
					price_per_unit: "50.00",
					vat_rate: 1,
					reset_point: 0,
				});
			}).toThrow(/FOREIGN KEY constraint failed/);
		});
	});

	describe("Data Type Validation", () => {
		it("should handle boolean fields correctly", () => {
			db.prepare(contactQueries.create).run({
				ico: "12345678",
				modifier: 1,
				dic: null,
				company_name: "Test Company",
				representative_name: null,
				street: null,
				city: null,
				postal_code: null,
				is_supplier: 1,
				is_customer: 0,
				price_group: 1,
				phone: null,
				email: null,
				website: null,
				bank_account: null,
			});

			const contact = db
				.prepare("SELECT * FROM contacts WHERE ico = ?")
				.get("12345678") as { is_supplier: number; is_customer: number };

			expect(contact.is_supplier).toBe(1);
			expect(contact.is_customer).toBe(0);
		});

		it("should handle date fields correctly", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "001",
				type: 1,
				date_issue: "2024-01-15",
				payment_method: null,
				date_tax: "2024-01-15",
				date_due: "2024-02-15",
				variable_symbol: null,
				note: null,
				ico: null,
				modifier: null,
				dic: null,
				company_name: null,
				bank_account: null,
				street: null,
				city: null,
				postal_code: null,
				phone: null,
				email: null,
			});

			const invoice = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("INV", "001") as { date_issue: string; date_tax: string; date_due: string };

			expect(invoice.date_issue).toBe("2024-01-15");
			expect(invoice.date_tax).toBe("2024-01-15");
			expect(invoice.date_due).toBe("2024-02-15");
		});

		it("should handle TEXT fields with proper encoding", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "001",
				type: 1,
				date_issue: "2024-01-15",
				payment_method: null,
				date_tax: null,
				date_due: null,
				variable_symbol: null,
				note: "Czech characters: ěščřžýáíé, Special: €$£¥",
				ico: null,
				modifier: null,
				dic: null,
				company_name: null,
				bank_account: null,
				street: null,
				city: null,
				postal_code: null,
				phone: null,
				email: null,
			});

			const invoice = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("INV", "001") as { note: string };

			expect(invoice.note).toBe("Czech characters: ěščřžýáíé, Special: €$£¥");
		});
	});

	describe("Timestamp Validation", () => {
		it("should auto-generate created_at and updated_at", () => {
			db.prepare(itemQueries.create).run({
				ean: "1234567890123",
				category: null,
				name: "Test Item",
				note: null,
				vat_rate: 1,
				unit_of_measure: "ks",
				sale_price_group1: "100",
				sale_price_group2: "100",
				sale_price_group3: "100",
				sale_price_group4: "100",
			});

			const item = db
				.prepare("SELECT * FROM items WHERE ean = ?")
				.get("1234567890123") as { created_at: string; updated_at: string };

			expect(item.created_at).toBeDefined();
			expect(item.updated_at).toBeDefined();
			expect(new Date(item.created_at).getTime()).toBeGreaterThan(0);
		});

		it("should update updated_at on modification", async () => {
			db.prepare(itemQueries.create).run({
				ean: "1234567890123",
				category: null,
				name: "Test Item",
				note: null,
				vat_rate: 1,
				unit_of_measure: "ks",
				sale_price_group1: "100",
				sale_price_group2: "100",
				sale_price_group3: "100",
				sale_price_group4: "100",
			});

			const original = db
				.prepare("SELECT * FROM items WHERE ean = ?")
				.get("1234567890123") as { updated_at: string };

			await new Promise((resolve) => setTimeout(resolve, 10));

			db.prepare("UPDATE items SET name = ? WHERE ean = ?").run("Updated Item", "1234567890123");

			const updated = db
				.prepare("SELECT * FROM items WHERE ean = ?")
				.get("1234567890123") as { updated_at: string };

			expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
				new Date(original.updated_at).getTime(),
			);
		});
	});
});
