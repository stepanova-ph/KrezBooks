import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { invoiceQueries } from "../../main/queries/invoices";
import { stockMovementQueries } from "../../main/queries/stockMovements";
import { itemQueries } from "../../main/queries/items";
import {
	serializeInvoice,
	serializeStockMovement,
	serializeItem,
} from "../../utils/typeConverterUtils";

describe("Invoice Calculations", () => {
	let db: Database.Database;

	beforeEach(() => {
		db = new Database(":memory:");
		db.exec(itemQueries.createTable);
		db.exec(invoiceQueries.createTable);
		db.exec(stockMovementQueries.createTable);

		// Create test items with different VAT rates
		const insertItem = db.prepare(itemQueries.create);

		// 0% VAT item
		insertItem.run(
			serializeItem({
				ean: "1111111111111",
				name: "Item 0% VAT",
				vat_rate: 0,
				unit_of_measure: "ks",
				sale_price_group1: 100,
				sale_price_group2: 100,
				sale_price_group3: 100,
				sale_price_group4: 100,
			}),
		);

		// 12% VAT item
		insertItem.run(
			serializeItem({
				ean: "2222222222222",
				name: "Item 12% VAT",
				vat_rate: 1,
				unit_of_measure: "ks",
				sale_price_group1: 100,
				sale_price_group2: 100,
				sale_price_group3: 100,
				sale_price_group4: 100,
			}),
		);

		// 21% VAT item
		insertItem.run(
			serializeItem({
				ean: "3333333333333",
				name: "Item 21% VAT",
				vat_rate: 2,
				unit_of_measure: "ks",
				sale_price_group1: 100,
				sale_price_group2: 100,
				sale_price_group3: 100,
				sale_price_group4: 100,
			}),
		);

		// Create test invoice
		db.prepare(invoiceQueries.create).run(
			serializeInvoice({
				number: "INV-TEST",
				type: 1,
				date_issue: "2024-01-15",
			}),
		);
	});

	describe("Single line item calculations", () => {
		it("should calculate total with 0% VAT", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "1111111111111",
					amount: "10",
					price_per_unit: "50.00",
					vat_rate: 0,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			expect(invoice.total_without_vat).toBe(500);
			expect(invoice.total_with_vat).toBe(500);
		});

		it("should calculate total with 12% VAT", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "2222222222222",
					amount: "10",
					price_per_unit: "50.00",
					vat_rate: 1,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			// 10 * 50 = 500 without VAT
			// 500 * 1.12 = 560 with VAT
			expect(invoice.total_without_vat).toBe(500);
			expect(invoice.total_with_vat).toBe(560);
		});

		it("should calculate total with 21% VAT", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "3333333333333",
					amount: "10",
					price_per_unit: "50.00",
					vat_rate: 2,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			// 10 * 50 = 500 without VAT
			// 500 * 1.21 = 605 with VAT
			expect(invoice.total_without_vat).toBe(500);
			expect(invoice.total_with_vat).toBe(605);
		});
	});

	describe("Multiple line items with same VAT rate", () => {
		it("should sum multiple items with same VAT rate", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "3333333333333",
					amount: "5",
					price_per_unit: "100.00",
					vat_rate: 2,
				}),
			);

			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "1111111111111",
					amount: "3",
					price_per_unit: "50.00",
					vat_rate: 2,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			// (5 * 100) + (3 * 50) = 500 + 150 = 650 without VAT
			// 650 * 1.21 = 786.5 with VAT
			expect(invoice.total_without_vat).toBe(650);
			expect(invoice.total_with_vat).toBe(786.5);
		});
	});

	describe("Multiple line items with different VAT rates", () => {
		it("should calculate total with mixed VAT rates", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			// 0% VAT: 10 * 50 = 500 → 500
			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "1111111111111",
					amount: "10",
					price_per_unit: "50.00",
					vat_rate: 0,
				}),
			);

			// 12% VAT: 5 * 100 = 500 → 560
			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "2222222222222",
					amount: "5",
					price_per_unit: "100.00",
					vat_rate: 1,
				}),
			);

			// 21% VAT: 20 * 30 = 600 → 726
			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "3333333333333",
					amount: "20",
					price_per_unit: "30.00",
					vat_rate: 2,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			// Total without VAT: 500 + 500 + 600 = 1600
			expect(invoice.total_without_vat).toBe(1600);

			// Total with VAT: 500 + 560 + 726 = 1786
			expect(invoice.total_with_vat).toBe(1786);
		});

		it("should handle complex mixed VAT scenario", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			// Multiple items with different VAT rates
			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "1111111111111",
					amount: "2",
					price_per_unit: "150.50",
					vat_rate: 0,
				}),
			);

			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "2222222222222",
					amount: "3",
					price_per_unit: "75.25",
					vat_rate: 1,
				}),
			);

			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "3333333333333",
					amount: "1",
					price_per_unit: "200.00",
					vat_rate: 2,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			// Without VAT: (2 * 150.50) + (3 * 75.25) + (1 * 200) = 301 + 225.75 + 200 = 726.75
			expect(invoice.total_without_vat).toBeCloseTo(726.75, 2);

			// With VAT: 301 + (225.75 * 1.12) + (200 * 1.21) = 301 + 252.84 + 242 = 795.84
			expect(invoice.total_with_vat).toBeCloseTo(795.84, 2);
		});
	});

	describe("Edge cases", () => {
		it("should handle zero quantity", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "3333333333333",
					amount: "0",
					price_per_unit: "100.00",
					vat_rate: 2,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			expect(invoice.total_without_vat).toBe(0);
			expect(invoice.total_with_vat).toBe(0);
		});

		it("should handle zero price", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "3333333333333",
					amount: "10",
					price_per_unit: "0.00",
					vat_rate: 2,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			expect(invoice.total_without_vat).toBe(0);
			expect(invoice.total_with_vat).toBe(0);
		});

		it("should handle decimal quantities", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "3333333333333",
					amount: "2.5",
					price_per_unit: "100.00",
					vat_rate: 2,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			// 2.5 * 100 = 250 without VAT
			// 250 * 1.21 = 302.5 with VAT
			expect(invoice.total_without_vat).toBe(250);
			expect(invoice.total_with_vat).toBe(302.5);
		});

		it("should handle very small amounts", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "3333333333333",
					amount: "0.01",
					price_per_unit: "0.50",
					vat_rate: 2,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			// 0.01 * 0.50 = 0.005 without VAT
			// 0.005 * 1.21 = 0.00605 with VAT
			expect(invoice.total_without_vat).toBeCloseTo(0.005, 3);
			expect(invoice.total_with_vat).toBeCloseTo(0.00605, 5);
		});

		it("should handle large amounts", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "3333333333333",
					amount: "1000",
					price_per_unit: "999.99",
					vat_rate: 2,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			// 1000 * 999.99 = 999990 without VAT
			// 999990 * 1.21 = 1209987.9 with VAT
			expect(invoice.total_without_vat).toBeCloseTo(999990, 2);
			expect(invoice.total_with_vat).toBeCloseTo(1209987.9, 1);
		});

		it("should handle negative amounts (returns/corrections)", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "3333333333333",
					amount: "-5",
					price_per_unit: "100.00",
					vat_rate: 2,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			// -5 * 100 = -500 without VAT
			// -500 * 1.21 = -605 with VAT
			expect(invoice.total_without_vat).toBe(-500);
			expect(invoice.total_with_vat).toBe(-605);
		});

		it("should return zero totals when invoice has no stock movements", () => {
			const invoice = db.prepare(invoiceQueries.getAll).get();

			expect(invoice.total_without_vat).toBe(0);
			expect(invoice.total_with_vat).toBe(0);
		});
	});

	describe("Rounding precision", () => {
		it("should handle prices that produce many decimal places", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			// 3 * 33.33 = 99.99, with 21% VAT = 120.9879
			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "3333333333333",
					amount: "3",
					price_per_unit: "33.33",
					vat_rate: 2,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			expect(invoice.total_without_vat).toBeCloseTo(99.99, 2);
			expect(invoice.total_with_vat).toBeCloseTo(120.9879, 4);
		});

		it("should handle calculation with repeating decimals", () => {
			const insertMovement = db.prepare(stockMovementQueries.create);

			// 7 * 15.15 = 106.05, with 12% VAT = 118.776
			insertMovement.run(
				serializeStockMovement({
					invoice_number: "INV-TEST",
					item_ean: "2222222222222",
					amount: "7",
					price_per_unit: "15.15",
					vat_rate: 1,
				}),
			);

			const invoice = db.prepare(invoiceQueries.getAll).get();

			expect(invoice.total_without_vat).toBeCloseTo(106.05, 2);
			expect(invoice.total_with_vat).toBeCloseTo(118.776, 3);
		});
	});
});
