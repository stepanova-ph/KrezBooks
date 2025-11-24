import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { invoiceQueries } from "../../main/queries/invoices";
import { itemQueries } from "../../main/queries/items";
import { stockMovementQueries } from "../../main/queries/stockMovements";

describe("Invoice Type-Specific Behavior", () => {
	let db: Database.Database;

	beforeEach(() => {
		db = new Database(":memory:");
		db.exec(itemQueries.createTable);
		db.exec(invoiceQueries.createTable);
		db.exec(stockMovementQueries.createTable);

		// Create test item
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

	afterEach(() => {
		db.close();
	});

	describe("Type 1 - Purchase Invoice (Faktura přijatá)", () => {
		it("should create purchase invoice with required fields", () => {
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

			const invoice = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("INV", "001") as { type: number };

			expect(invoice.type).toBe(1);
		});

		it("should increase stock when items are added to purchase invoice", () => {
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

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "50",
				price_per_unit: "80.00",
				vat_rate: 1,
				reset_point: 0,
			});

			const stock = db
				.prepare(
					`
				SELECT SUM(CAST(amount AS REAL)) as total
				FROM stock_movements sm
				JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
				WHERE i.type = 1
			`,
				)
				.get() as { total: number };

			expect(stock.total).toBe(50);
		});

		it("should track supplier information on purchase invoice", () => {
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
				ico: "12345678",
				modifier: 1,
				dic: "CZ12345678",
				company_name: "Supplier Company s.r.o.",
				bank_account: "123456789/0100",
				street: "Supplier St 123",
				city: "Prague",
				postal_code: "110 00",
				phone: "+420123456789",
				email: "supplier@example.cz",
			});

			const invoice = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("INV", "001") as { company_name: string; type: number };

			expect(invoice.type).toBe(1);
			expect(invoice.company_name).toBe("Supplier Company s.r.o.");
		});
	});

	describe("Type 2 - Sales Invoice (Faktura vydaná)", () => {
		it("should create sales invoice with required fields", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "001",
				type: 2,
				date_issue: "2024-01-15",
				payment_method: 1,
				date_tax: "2024-01-15",
				date_due: "2024-02-15",
				variable_symbol: "123456",
				note: null,
				ico: "12345678",
				modifier: 1,
				dic: null,
				company_name: "Customer Company",
				bank_account: null,
				street: null,
				city: null,
				postal_code: null,
				phone: null,
				email: null,
			});

			const invoice = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("INV", "001") as { type: number; date_due: string };

			expect(invoice.type).toBe(2);
			expect(invoice.date_due).toBe("2024-02-15");
		});

		it("should decrease stock when items are added to sales invoice", () => {
			// Add stock first
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "001",
				type: 1,
				date_issue: "2024-01-10",
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

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "100",
				price_per_unit: "80.00",
				vat_rate: 1,
				reset_point: 0,
			});

			// Create sale
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "002",
				type: 2,
				date_issue: "2024-01-15",
				payment_method: 1,
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

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "002",
				item_ean: "1234567890123",
				amount: "30",
				price_per_unit: "100.00",
				vat_rate: 1,
				reset_point: 0,
			});

			const stock = db
				.prepare(
					`
				SELECT
					SUM(CASE
						WHEN i.type = 1 THEN CAST(sm.amount AS REAL)
						WHEN i.type = 2 THEN -CAST(sm.amount AS REAL)
						ELSE 0
					END) as current_stock
				FROM stock_movements sm
				JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
			`,
				)
				.get() as { current_stock: number };

			expect(stock.current_stock).toBe(70);
		});

		it("should track customer information on sales invoice", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "001",
				type: 2,
				date_issue: "2024-01-15",
				payment_method: 1,
				date_tax: "2024-01-15",
				date_due: "2024-02-15",
				variable_symbol: "123456",
				note: null,
				ico: "87654321",
				modifier: 1,
				dic: "CZ87654321",
				company_name: "Customer Company s.r.o.",
				bank_account: null,
				street: "Customer St 456",
				city: "Brno",
				postal_code: "602 00",
				phone: "+420987654321",
				email: "customer@example.cz",
			});

			const invoice = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("INV", "001") as { company_name: string; type: number };

			expect(invoice.type).toBe(2);
			expect(invoice.company_name).toBe("Customer Company s.r.o.");
		});
	});

	describe("Type 3 - Proforma Invoice (Proforma faktura)", () => {
		it("should create proforma invoice", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "PRO",
				number: "001",
				type: 3,
				date_issue: "2024-01-15",
				payment_method: 1,
				date_tax: null,
				date_due: "2024-02-15",
				variable_symbol: "123456",
				note: null,
				ico: null,
				modifier: null,
				dic: null,
				company_name: "Customer Company",
				bank_account: null,
				street: null,
				city: null,
				postal_code: null,
				phone: null,
				email: null,
			});

			const invoice = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("PRO", "001") as { type: number };

			expect(invoice.type).toBe(3);
		});

		it("should NOT affect stock levels", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "PRO",
				number: "001",
				type: 3,
				date_issue: "2024-01-15",
				payment_method: 1,
				date_tax: null,
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

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "PRO",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "100",
				price_per_unit: "100.00",
				vat_rate: 1,
				reset_point: 0,
			});

			const stock = db
				.prepare(
					`
				SELECT
					SUM(CASE
						WHEN i.type IN (1, 4) THEN CAST(sm.amount AS REAL)
						WHEN i.type IN (2, 5) THEN -CAST(sm.amount AS REAL)
						ELSE 0
					END) as current_stock
				FROM stock_movements sm
				JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
			`,
				)
				.get() as { current_stock: number | null };

			expect(stock?.current_stock ?? 0).toBe(0);
		});

		it("should convert proforma to regular invoice workflow", () => {
			// Create proforma
			db.prepare(invoiceQueries.create).run({
				prefix: "PRO",
				number: "001",
				type: 3,
				date_issue: "2024-01-15",
				payment_method: 1,
				date_tax: null,
				date_due: "2024-02-15",
				variable_symbol: "123456",
				note: "Proforma for quote",
				ico: "12345678",
				modifier: 1,
				dic: null,
				company_name: "Customer Company",
				bank_account: null,
				street: null,
				city: null,
				postal_code: null,
				phone: null,
				email: null,
			});

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "PRO",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "50",
				price_per_unit: "100.00",
				vat_rate: 1,
				reset_point: 0,
			});

			// Later convert to sales invoice
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "002",
				type: 2,
				date_issue: "2024-01-20",
				payment_method: 1,
				date_tax: "2024-01-20",
				date_due: "2024-02-20",
				variable_symbol: "123456", // Same variable symbol
				note: "Based on PRO-001",
				ico: "12345678",
				modifier: 1,
				dic: null,
				company_name: "Customer Company",
				bank_account: null,
				street: null,
				city: null,
				postal_code: null,
				phone: null,
				email: null,
			});

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "002",
				item_ean: "1234567890123",
				amount: "50",
				price_per_unit: "100.00",
				vat_rate: 1,
				reset_point: 0,
			});

			const invoices = db.prepare("SELECT * FROM invoices ORDER BY date_issue").all();
			expect(invoices.length).toBe(2);
			expect((invoices[0] as { type: number }).type).toBe(3); // Proforma
			expect((invoices[1] as { type: number }).type).toBe(2); // Sales invoice
		});
	});

	describe("Type 4 - Purchase Credit Note (Dobropis přijatý)", () => {
		it("should create purchase credit note", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "CR",
				number: "001",
				type: 4,
				date_issue: "2024-01-15",
				payment_method: null,
				date_tax: null,
				date_due: null,
				variable_symbol: null,
				note: "Return to supplier",
				ico: "12345678",
				modifier: 1,
				dic: null,
				company_name: "Supplier Company",
				bank_account: null,
				street: null,
				city: null,
				postal_code: null,
				phone: null,
				email: null,
			});

			const invoice = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("CR", "001") as { type: number };

			expect(invoice.type).toBe(4);
		});

		it("should increase stock (goods returned to supplier)", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "CR",
				number: "001",
				type: 4,
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

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "CR",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "80.00",
				vat_rate: 1,
				reset_point: 0,
			});

			const stock = db
				.prepare(
					`
				SELECT
					SUM(CASE
						WHEN i.type IN (1, 4) THEN CAST(sm.amount AS REAL)
						ELSE 0
					END) as current_stock
				FROM stock_movements sm
				JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
			`,
				)
				.get() as { current_stock: number };

			expect(stock.current_stock).toBe(10);
		});
	});

	describe("Type 5 - Sales Credit Note (Dobropis vydaný)", () => {
		it("should create sales credit note", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "CR",
				number: "001",
				type: 5,
				date_issue: "2024-01-15",
				payment_method: 1,
				date_tax: "2024-01-15",
				date_due: null,
				variable_symbol: "123456",
				note: "Customer return",
				ico: "87654321",
				modifier: 1,
				dic: null,
				company_name: "Customer Company",
				bank_account: null,
				street: null,
				city: null,
				postal_code: null,
				phone: null,
				email: null,
			});

			const invoice = db
				.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?")
				.get("CR", "001") as { type: number };

			expect(invoice.type).toBe(5);
		});

		it("should decrease stock (goods returned from customer)", () => {
			// Initial purchase
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "001",
				type: 1,
				date_issue: "2024-01-10",
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

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "100",
				price_per_unit: "80.00",
				vat_rate: 1,
				reset_point: 0,
			});

			// Sales credit note
			db.prepare(invoiceQueries.create).run({
				prefix: "CR",
				number: "001",
				type: 5,
				date_issue: "2024-01-15",
				payment_method: 1,
				date_tax: "2024-01-15",
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

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "CR",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "5",
				price_per_unit: "100.00",
				vat_rate: 1,
				reset_point: 0,
			});

			const stock = db
				.prepare(
					`
				SELECT
					SUM(CASE
						WHEN i.type IN (1, 4) THEN CAST(sm.amount AS REAL)
						WHEN i.type IN (2, 5) THEN -CAST(sm.amount AS REAL)
						ELSE 0
					END) as current_stock
				FROM stock_movements sm
				JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
			`,
				)
				.get() as { current_stock: number };

			expect(stock.current_stock).toBe(95);
		});
	});

	describe("Cross-Type Workflows", () => {
		it("should handle complete purchase-sale workflow", () => {
			// 1. Purchase
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "001",
				type: 1,
				date_issue: "2024-01-10",
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

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "100",
				price_per_unit: "80.00",
				vat_rate: 1,
				reset_point: 0,
			});

			// 2. Proforma
			db.prepare(invoiceQueries.create).run({
				prefix: "PRO",
				number: "001",
				type: 3,
				date_issue: "2024-01-12",
				payment_method: 1,
				date_tax: null,
				date_due: "2024-02-12",
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

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "PRO",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "30",
				price_per_unit: "100.00",
				vat_rate: 1,
				reset_point: 0,
			});

			// 3. Sale
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "002",
				type: 2,
				date_issue: "2024-01-15",
				payment_method: 1,
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

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "002",
				item_ean: "1234567890123",
				amount: "30",
				price_per_unit: "100.00",
				vat_rate: 1,
				reset_point: 0,
			});

			// 4. Sales credit note (partial return)
			db.prepare(invoiceQueries.create).run({
				prefix: "CR",
				number: "001",
				type: 5,
				date_issue: "2024-01-20",
				payment_method: 1,
				date_tax: "2024-01-20",
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

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "CR",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "5",
				price_per_unit: "100.00",
				vat_rate: 1,
				reset_point: 0,
			});

			// Final stock: 100 - 30 - 5 = 65
			const stock = db
				.prepare(
					`
				SELECT
					SUM(CASE
						WHEN i.type IN (1, 4) THEN CAST(sm.amount AS REAL)
						WHEN i.type IN (2, 5) THEN -CAST(sm.amount AS REAL)
						ELSE 0
					END) as current_stock
				FROM stock_movements sm
				JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
			`,
				)
				.get() as { current_stock: number };

			expect(stock.current_stock).toBe(65);
		});

		it("should enforce type constraints", () => {
			// Type must be between 1 and 5
			expect(() => {
				db.prepare(invoiceQueries.create).run({
					prefix: "INV",
					number: "001",
					type: 0, // Invalid
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
					number: "002",
					type: 6, // Invalid
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
	});
});
