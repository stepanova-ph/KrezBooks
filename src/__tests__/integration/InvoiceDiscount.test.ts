import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { invoiceQueries } from "../../main/queries/invoices";
import { itemQueries } from "../../main/queries/items";
import { stockMovementQueries } from "../../main/queries/stockMovements";
import { serializeInvoice } from "../../utils/typeConverterUtils";
import { invoiceSchema } from "../../validation/invoiceSchema";
import { prepareInvoicePrintData } from "../../service/printService";
import type { Invoice, StockMovement } from "../../types/database";

describe("Invoice Discount", () => {
	describe("database column", () => {
		let db: Database.Database;

		beforeEach(() => {
			db = new Database(":memory:");
			db.exec(itemQueries.createTable);
			db.exec(invoiceQueries.createTable);
			db.exec(stockMovementQueries.createTable);

			db.prepare(itemQueries.create).run({
				ean: "1234567890123",
				category: null,
				name: "Test Item",
				note: null,
				vat_rate: 2, // 21 %
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

		const insertInvoice = (discount: number | null | undefined) => {
			db.prepare(invoiceQueries.create).run(
				serializeInvoice({
					prefix: "PH",
					number: "001",
					type: 3,
					date_issue: "2024-01-15",
					date_tax: "2024-01-15",
					discount,
				}),
			);
		};

		it("should persist the discount on the invoice", () => {
			insertInvoice(20);

			const invoice = db
				.prepare("SELECT discount FROM invoices WHERE prefix = ? AND number = ?")
				.get("PH", "001") as { discount: number | null };

			expect(invoice.discount).toBe(20);
		});

		it("should default to NULL when no discount is given", () => {
			insertInvoice(undefined);

			const invoice = db
				.prepare("SELECT discount FROM invoices WHERE prefix = ? AND number = ?")
				.get("PH", "001") as { discount: number | null };

			expect(invoice.discount).toBeNull();
		});

		it("should reject discount values outside 1-100", () => {
			expect(() => insertInvoice(0)).toThrow(/CHECK constraint failed/);
			expect(() => insertInvoice(101)).toThrow(/CHECK constraint failed/);
		});

		it("should NOT affect invoice list totals (list shows full prices)", () => {
			insertInvoice(50);

			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "PH",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "-2", // sale stores negative
				price_per_unit: "100.00",
				vat_rate: 2, // 21 %
				reset_point: 0,
			});

			const fromGetOne = db
				.prepare(invoiceQueries.getOne)
				.get("PH", "001") as {
				total_without_vat: number;
				total_with_vat: number;
			};

			// Full, undiscounted prices in the list
			expect(fromGetOne.total_without_vat).toBeCloseTo(200);
			expect(fromGetOne.total_with_vat).toBeCloseTo(242);
		});
	});

	describe("validation schema", () => {
		const validInvoice = {
			prefix: "PH",
			number: "0001",
			type: 3,
			date_issue: "2024-01-15",
			date_tax: "2024-01-15",
			is_in_eur: false,
		};

		it("should accept a missing/empty discount as null", () => {
			expect(invoiceSchema.safeParse(validInvoice).success).toBe(true);
			expect(
				invoiceSchema.safeParse({ ...validInvoice, discount: null }).success,
			).toBe(true);
			expect(
				invoiceSchema.safeParse({ ...validInvoice, discount: "" }).success,
			).toBe(true);
		});

		it("should accept discounts 1-100", () => {
			for (const discount of [1, 10, 50, 100]) {
				expect(
					invoiceSchema.safeParse({ ...validInvoice, discount }).success,
				).toBe(true);
			}
		});

		it("should reject invalid discounts", () => {
			for (const discount of [0, -5, 101, 10.5]) {
				expect(
					invoiceSchema.safeParse({ ...validInvoice, discount }).success,
				).toBe(false);
			}
		});
	});

	describe("print calculations", () => {
		const makeInvoice = (discount: number | null): Invoice => ({
			prefix: "PH",
			number: "001",
			type: 3,
			date_issue: "2024-01-15",
			date_tax: "2024-01-15",
			is_in_eur: false,
			discount,
		});

		// 2 pcs at 100 CZK without VAT, 21 % => base 200, VAT 42, total 242
		const movements: StockMovement[] = [
			{
				invoice_prefix: "PH",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: -2,
				price_per_unit: 100,
				vat_rate: 2,
			},
		];
		const itemNames = new Map([["1234567890123", "Test Item"]]);
		const itemUnits = new Map([["1234567890123", "ks"]]);

		it("should keep item lines at original prices and discount the totals", () => {
			const data = prepareInvoicePrintData(
				makeInvoice(50),
				movements,
				itemNames,
				itemUnits,
			);

			// Item lines untouched
			expect(data.items[0].priceWithoutVat).toBeCloseTo(100);
			expect(data.items[0].totalWithVat).toBeCloseTo(242);

			// Subtotal is pre-discount, discount halves everything below it
			expect(data.totals.subtotalBeforeDiscount).toBeCloseTo(242);
			expect(data.totals.discount).toBe(50);
			expect(data.totals.discountAmount).toBeCloseTo(121);
			expect(data.totals.totalWithoutVat).toBeCloseTo(100);
			expect(data.totals.totalVatAmount).toBeCloseTo(21);
			expect(data.totals.totalWithVat).toBeCloseTo(121); // 121 rounds to itself
		});

		it("should compute the VAT recap from discounted bases", () => {
			const data = prepareInvoicePrintData(
				makeInvoice(50),
				movements,
				itemNames,
				itemUnits,
			);

			expect(data.vatRecap).toHaveLength(1);
			expect(data.vatRecap[0].vatRate).toBe(21);
			expect(data.vatRecap[0].baseAmount).toBeCloseTo(100);
			expect(data.vatRecap[0].vatAmount).toBeCloseTo(21);
			expect(data.vatRecap[0].totalAmount).toBeCloseTo(121);
		});

		it("should leave totals unchanged without a discount", () => {
			const data = prepareInvoicePrintData(
				makeInvoice(null),
				movements,
				itemNames,
				itemUnits,
			);

			expect(data.totals.discount).toBeNull();
			expect(data.totals.discountAmount).toBeCloseTo(0);
			expect(data.totals.subtotalBeforeDiscount).toBeCloseTo(
				data.totals.totalBeforeRounding,
			);
			expect(data.totals.totalWithVat).toBeCloseTo(242);
		});

		it("should ignore a discount on a dobropis (type 6)", () => {
			const dobropis: Invoice = {
				...makeInvoice(50),
				type: 6,
				prefix: "D",
			};
			const returnMovements: StockMovement[] = [
				{ ...movements[0], invoice_prefix: "D", amount: 2 },
			];

			const data = prepareInvoicePrintData(
				dobropis,
				returnMovements,
				itemNames,
				itemUnits,
			);

			expect(data.totals.discount).toBeNull();
			expect(data.totals.totalWithVat).toBeCloseTo(-242);
			expect(data.items[0].amount).toBe(-2);
		});
	});
});
