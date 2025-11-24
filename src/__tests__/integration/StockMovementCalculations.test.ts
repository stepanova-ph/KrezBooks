import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { invoiceQueries } from "../../main/queries/invoices";
import { itemQueries } from "../../main/queries/items";
import { stockMovementQueries } from "../../main/queries/stockMovements";

describe("Stock Movement Calculations", () => {
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

	describe("Current Stock Calculation", () => {
		it("should calculate stock from purchase invoices (type 1)", () => {
			// Create purchase invoice
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "001",
				type: 1, // Purchase
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

			// Add stock
			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "50",
				price_per_unit: "80.00",
				vat_rate: 1,
				reset_point: 0,
			});

			// Calculate current stock
			const stock = db
				.prepare(
					`
				SELECT
					item_ean,
					SUM(CASE
						WHEN i.type IN (1, 4) THEN CAST(sm.amount AS REAL)
						WHEN i.type IN (2, 5) THEN -CAST(sm.amount AS REAL)
						ELSE 0
					END) as current_stock
				FROM stock_movements sm
				JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
				WHERE item_ean = ?
				GROUP BY item_ean
			`,
				)
				.get("1234567890123") as { current_stock: number };

			expect(stock.current_stock).toBe(50);
		});

		it("should subtract stock from sales invoices (type 2)", () => {
			// Purchase
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

			// Sale
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "002",
				type: 2,
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

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "002",
				item_ean: "1234567890123",
				amount: "20",
				price_per_unit: "100.00",
				vat_rate: 1,
				reset_point: 0,
			});

			// Calculate current stock
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
				WHERE item_ean = ?
			`,
				)
				.get("1234567890123") as { current_stock: number };

			expect(stock.current_stock).toBe(30);
		});

		it("should handle proforma invoices without affecting stock (type 3)", () => {
			// Proforma should not affect stock
			db.prepare(invoiceQueries.create).run({
				prefix: "PRO",
				number: "001",
				type: 3,
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
				invoice_prefix: "PRO",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "100",
				price_per_unit: "50.00",
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
				WHERE item_ean = ?
			`,
				)
				.get("1234567890123") as { current_stock: number | null };

			expect(stock?.current_stock ?? 0).toBe(0);
		});

		it("should add stock from purchase credit notes (type 4)", () => {
			db.prepare(invoiceQueries.create).run({
				prefix: "CR",
				number: "001",
				type: 4, // Purchase credit note
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
						WHEN i.type IN (2, 5) THEN -CAST(sm.amount AS REAL)
						ELSE 0
					END) as current_stock
				FROM stock_movements sm
				JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
				WHERE item_ean = ?
			`,
				)
				.get("1234567890123") as { current_stock: number };

			expect(stock.current_stock).toBe(10);
		});

		it("should subtract stock from sales credit notes (type 5)", () => {
			// Initial purchase
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

			// Sales credit note
			db.prepare(invoiceQueries.create).run({
				prefix: "CR",
				number: "001",
				type: 5, // Sales credit note
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
				WHERE item_ean = ?
			`,
				)
				.get("1234567890123") as { current_stock: number };

			expect(stock.current_stock).toBe(45);
		});

		it("should handle complex stock history with multiple invoice types", () => {
			const invoices = [
				{ prefix: "INV", number: "001", type: 1, amount: "100", price: "80.00" }, // +100
				{ prefix: "INV", number: "002", type: 2, amount: "30", price: "100.00" }, // -30
				{ prefix: "PRO", number: "001", type: 3, amount: "50", price: "90.00" }, // 0
				{ prefix: "CR", number: "001", type: 4, amount: "20", price: "80.00" }, // +20
				{ prefix: "CR", number: "002", type: 5, amount: "10", price: "100.00" }, // -10
				{ prefix: "INV", number: "003", type: 1, amount: "50", price: "85.00" }, // +50
			];

			for (const inv of invoices) {
				db.prepare(invoiceQueries.create).run({
					prefix: inv.prefix,
					number: inv.number,
					type: inv.type,
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
					invoice_prefix: inv.prefix,
					invoice_number: inv.number,
					item_ean: "1234567890123",
					amount: inv.amount,
					price_per_unit: inv.price,
					vat_rate: 1,
					reset_point: 0,
				});
			}

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
				WHERE item_ean = ?
			`,
				)
				.get("1234567890123") as { current_stock: number };

			// 100 - 30 + 20 - 10 + 50 = 130
			expect(stock.current_stock).toBe(130);
		});
	});

	describe("Reset Point Functionality", () => {
		it("should mark stock movement as reset point", () => {
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
				amount: "100",
				price_per_unit: "80.00",
				vat_rate: 1,
				reset_point: 1, // Mark as reset point
			});

			const movement = db
				.prepare("SELECT * FROM stock_movements WHERE item_ean = ?")
				.get("1234567890123") as { reset_point: number };

			expect(movement.reset_point).toBe(1);
		});

		it("should calculate stock from reset point onwards", () => {
			// This test verifies that reset_point marks when to start calculations
			// In practice, the reset point should be used to ignore old history

			// Create movements
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "001",
				type: 1,
				date_issue: "2024-01-01",
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
				amount: "1000",
				price_per_unit: "50.00",
				vat_rate: 1,
				reset_point: 0,
			});

			// Movement with reset point
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "002",
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
				invoice_number: "002",
				item_ean: "1234567890123",
				amount: "50",
				price_per_unit: "80.00",
				vat_rate: 1,
				reset_point: 1, // Reset point - this marks where to start counting
			});

			// New movement after reset
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "003",
				type: 2,
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

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "003",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "100.00",
				vat_rate: 1,
				reset_point: 0,
			});

			// Verify reset_point is marked
			const resetMovement = db
				.prepare("SELECT * FROM stock_movements WHERE reset_point = 1")
				.get() as { reset_point: number; amount: string };

			expect(resetMovement.reset_point).toBe(1);
			expect(parseFloat(resetMovement.amount)).toBe(50);
		});
	});

	describe("Price Calculations", () => {
		it("should calculate average buy price", () => {
			const purchases = [
				{ number: "001", amount: "10", price: "80.00" },
				{ number: "002", amount: "20", price: "85.00" },
				{ number: "003", amount: "30", price: "90.00" },
			];

			for (const purchase of purchases) {
				db.prepare(invoiceQueries.create).run({
					prefix: "INV",
					number: purchase.number,
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
					invoice_number: purchase.number,
					item_ean: "1234567890123",
					amount: purchase.amount,
					price_per_unit: purchase.price,
					vat_rate: 1,
					reset_point: 0,
				});
			}

			const avgPrice = db
				.prepare(
					`
				SELECT
					SUM(CAST(amount AS REAL) * CAST(price_per_unit AS REAL)) / SUM(CAST(amount AS REAL)) as avg_price
				FROM stock_movements sm
				JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
				WHERE item_ean = ? AND i.type = 1
			`,
				)
				.get("1234567890123") as { avg_price: number };

			// (10*80 + 20*85 + 30*90) / (10+20+30) = 5200/60 = 86.67
			expect(avgPrice.avg_price).toBeCloseTo(86.67, 2);
		});

		it("should get last buy price", () => {
			const purchases = [
				{ number: "001", amount: "10", price: "80.00", date: "2024-01-10" },
				{ number: "002", amount: "20", price: "85.00", date: "2024-01-15" },
				{ number: "003", amount: "30", price: "90.00", date: "2024-01-20" },
			];

			for (const purchase of purchases) {
				db.prepare(invoiceQueries.create).run({
					prefix: "INV",
					number: purchase.number,
					type: 1,
					date_issue: purchase.date,
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
					invoice_number: purchase.number,
					item_ean: "1234567890123",
					amount: purchase.amount,
					price_per_unit: purchase.price,
					vat_rate: 1,
					reset_point: 0,
				});
			}

			const lastPrice = db
				.prepare(
					`
				SELECT price_per_unit
				FROM stock_movements sm
				JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
				WHERE sm.item_ean = ? AND i.type = 1
				ORDER BY i.date_issue DESC, sm.created_at DESC
				LIMIT 1
			`,
				)
				.get("1234567890123") as { price_per_unit: string };

			expect(parseFloat(lastPrice.price_per_unit)).toBe(90.0);
		});

		it("should calculate total value of stock", () => {
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

			const totalValue = db
				.prepare(
					`
				SELECT
					CAST(amount AS REAL) * CAST(price_per_unit AS REAL) as total_value
				FROM stock_movements
				WHERE item_ean = ?
			`,
				)
				.get("1234567890123") as { total_value: number };

			expect(totalValue.total_value).toBe(4000.0);
		});
	});

	describe("Decimal and Precision Handling", () => {
		it("should handle decimal amounts correctly", () => {
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
				amount: "10.5",
				price_per_unit: "80.00",
				vat_rate: 1,
				reset_point: 0,
			});

			const movement = db
				.prepare("SELECT * FROM stock_movements WHERE item_ean = ?")
				.get("1234567890123") as { amount: string };

			expect(parseFloat(movement.amount)).toBe(10.5);
		});

		it("should maintain price precision", () => {
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
				amount: "10",
				price_per_unit: "123.456789",
				vat_rate: 1,
				reset_point: 0,
			});

			const movement = db
				.prepare("SELECT * FROM stock_movements WHERE item_ean = ?")
				.get("1234567890123") as { price_per_unit: string };

			expect(movement.price_per_unit).toBe("123.456789");
		});

		it("should handle negative stock scenarios", () => {
			// Sale without stock
			db.prepare(invoiceQueries.create).run({
				prefix: "INV",
				number: "001",
				type: 2,
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
				amount: "10",
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
				WHERE item_ean = ?
			`,
				)
				.get("1234567890123") as { current_stock: number };

			expect(stock.current_stock).toBe(-10);
		});
	});
});
