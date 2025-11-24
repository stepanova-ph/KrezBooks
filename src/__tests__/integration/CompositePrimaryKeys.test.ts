import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { invoiceQueries } from "../../main/queries/invoices";
import { itemQueries } from "../../main/queries/items";
import { stockMovementQueries } from "../../main/queries/stockMovements";
import { contactQueries } from "../../main/queries/contacts";

describe("Composite Primary Key Edge Cases", () => {
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

	describe("Invoice Composite Primary Key", () => {
		it("should enforce uniqueness on (prefix, number) combination", () => {
			const invoice = {
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
			};

			db.prepare(invoiceQueries.create).run(invoice);

			// Should fail - same prefix and number
			expect(() => {
				db.prepare(invoiceQueries.create).run(invoice);
			}).toThrow(/UNIQUE constraint failed/);
		});

		it("should allow same number with different prefix", () => {
			const invoice1 = {
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
			};

			const invoice2 = {
				...invoice1,
				prefix: "PRO", // Different prefix
			};

			db.prepare(invoiceQueries.create).run(invoice1);
			db.prepare(invoiceQueries.create).run(invoice2);

			const invoices = db.prepare("SELECT * FROM invoices").all();
			expect(invoices.length).toBe(2);
		});

		it("should allow same prefix with different number", () => {
			const invoice1 = {
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
			};

			const invoice2 = {
				...invoice1,
				number: "002", // Different number
			};

			db.prepare(invoiceQueries.create).run(invoice1);
			db.prepare(invoiceQueries.create).run(invoice2);

			const invoices = db.prepare("SELECT * FROM invoices").all();
			expect(invoices.length).toBe(2);
		});

		it("should not allow null values in primary key", () => {
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
			}).toThrow(/NOT NULL constraint failed/);

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
			}).toThrow(/NOT NULL constraint failed/);
		});

		it("should retrieve invoice using both parts of composite key", () => {
			const invoice = {
				prefix: "INV",
				number: "001",
				type: 1,
				date_issue: "2024-01-15",
				payment_method: null,
				date_tax: null,
				date_due: null,
				variable_symbol: null,
				note: "Test Invoice",
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
			};

			db.prepare(invoiceQueries.create).run(invoice);

			const retrieved = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("INV", "001");

			expect(retrieved).toMatchObject({
				prefix: "INV",
				number: "001",
				note: "Test Invoice",
			});
		});
	});

	describe("Stock Movement Composite Primary Key", () => {
		beforeEach(() => {
			// Setup prerequisites
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

		it("should enforce uniqueness on (invoice_prefix, invoice_number, item_ean)", () => {
			const movement = {
				invoice_prefix: "INV",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "50.00",
				vat_rate: 1,
				reset_point: 0,
			};

			db.prepare(stockMovementQueries.create).run(movement);

			// Should fail - same composite key
			expect(() => {
				db.prepare(stockMovementQueries.create).run(movement);
			}).toThrow(/UNIQUE constraint failed/);
		});

		it("should allow different items on same invoice", () => {
			db.prepare(itemQueries.create).run({
				ean: "9999999999999",
				category: null,
				name: "Another Item",
				note: null,
				vat_rate: 1,
				unit_of_measure: "ks",
				sale_price_group1: "200",
				sale_price_group2: "200",
				sale_price_group3: "200",
				sale_price_group4: "200",
			});

			const movement1 = {
				invoice_prefix: "INV",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "50.00",
				vat_rate: 1,
				reset_point: 0,
			};

			const movement2 = {
				invoice_prefix: "INV",
				invoice_number: "001",
				item_ean: "9999999999999", // Different item
				amount: "5",
				price_per_unit: "75.00",
				vat_rate: 1,
				reset_point: 0,
			};

			db.prepare(stockMovementQueries.create).run(movement1);
			db.prepare(stockMovementQueries.create).run(movement2);

			const movements = db
				.prepare("SELECT * FROM stock_movements WHERE invoice_prefix = ? AND invoice_number = ?")
				.all("INV", "001");

			expect(movements.length).toBe(2);
		});

		it("should allow same item on different invoices", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "002",
				type: 1,
				date_issue: "2024-01-16",
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

			const movement1 = {
				invoice_prefix: "INV",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "50.00",
				vat_rate: 1,
				reset_point: 0,
			};

			const movement2 = {
				invoice_prefix: "INV",
				invoice_number: "002", // Different invoice
				item_ean: "1234567890123",
				amount: "5",
				price_per_unit: "55.00",
				vat_rate: 1,
				reset_point: 0,
			};

			db.prepare(stockMovementQueries.create).run(movement1);
			db.prepare(stockMovementQueries.create).run(movement2);

			const movements = db
				.prepare("SELECT * FROM stock_movements WHERE item_ean = ?")
				.all("1234567890123");

			expect(movements.length).toBe(2);
		});
	});

	describe("Foreign Key References with Composite Keys", () => {
		it("should enforce foreign key constraint on invoice composite key", () => {
			// Try to create stock movement without invoice
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

		it("should cascade delete stock movements when invoice is deleted", () => {
			// Setup
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

			// Verify stock movement exists
			let movements = db.prepare("SELECT * FROM stock_movements").all();
			expect(movements.length).toBe(1);

			// Delete invoice
			db.pragma("foreign_keys = ON");
			db.prepare("DELETE FROM invoices WHERE prefix = ? AND number = ?").run("INV", "001");

			// Verify stock movement was cascaded
			movements = db.prepare("SELECT * FROM stock_movements").all();
			expect(movements.length).toBe(0);
		});

		it("should validate both parts of composite foreign key", () => {
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

			// Should fail - wrong prefix
			expect(() => {
				db.pragma("foreign_keys = ON");
				db.prepare(stockMovementQueries.create).run({
					invoice_prefix: "PRO", // Wrong prefix
					invoice_number: "001",
					item_ean: "1234567890123",
					amount: "10",
					price_per_unit: "50.00",
					vat_rate: 1,
					reset_point: 0,
				});
			}).toThrow(/FOREIGN KEY constraint failed/);

			// Should fail - wrong number
			expect(() => {
				db.pragma("foreign_keys = ON");
				db.prepare(stockMovementQueries.create).run({
					invoice_prefix: "INV",
					invoice_number: "999", // Wrong number
					item_ean: "1234567890123",
					amount: "10",
					price_per_unit: "50.00",
					vat_rate: 1,
					reset_point: 0,
				});
			}).toThrow(/FOREIGN KEY constraint failed/);
		});
	});

	describe("Query Performance with Composite Keys", () => {
		beforeEach(() => {
			// Create test data
			for (let i = 1; i <= 10; i++) {
				db.prepare(invoiceQueries.create).run({
					prefix: i % 2 === 0 ? "INV" : "PRO",
					number: i.toString().padStart(3, "0"),
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
			}
		});

		it("should efficiently query by prefix", () => {
			const invoices = db.prepare("SELECT * FROM invoices WHERE prefix = ?").all("INV");

			expect(invoices.length).toBe(5);
			expect(invoices.every((inv: any) => inv.prefix === "INV")).toBe(true);
		});

		it("should efficiently query by both prefix and number", () => {
			const invoice = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("INV", "002");

			expect(invoice).toBeDefined();
			expect(invoice).toMatchObject({
				prefix: "INV",
				number: "002",
			});
		});

		it("should handle queries with partial matches", () => {
			const invoices = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number LIKE ?")
				.all("INV", "00%");

			expect(invoices.length).toBeGreaterThan(0);
			expect(invoices.every((inv: any) => inv.prefix === "INV")).toBe(true);
		});
	});

	describe("Edge Cases with Composite Keys", () => {
		it("should handle special characters in prefix", () => {
			const invoice = {
				prefix: "INV-2024",
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
			};

			db.prepare(invoiceQueries.create).run(invoice);

			const retrieved = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("INV-2024", "001");

			expect(retrieved).toMatchObject({
				prefix: "INV-2024",
				number: "001",
			});
		});

		it("should handle long prefix and number values", () => {
			const invoice = {
				prefix: "A".repeat(50),
				number: "1".repeat(50),
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
			};

			db.prepare(invoiceQueries.create).run(invoice);

			const retrieved = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("A".repeat(50), "1".repeat(50));

			expect(retrieved).toBeDefined();
		});

		it("should handle whitespace in composite key values", () => {
			const invoice = {
				prefix: "INV 2024",
				number: "001 A",
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
			};

			db.prepare(invoiceQueries.create).run(invoice);

			const retrieved = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("INV 2024", "001 A");

			expect(retrieved).toMatchObject({
				prefix: "INV 2024",
				number: "001 A",
			});
		});
	});
});
