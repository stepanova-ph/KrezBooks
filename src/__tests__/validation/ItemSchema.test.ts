import { describe, it, expect } from "vitest";
import { itemSchema } from "../../validation/itemSchema";
import { Item } from "../../types/database";

describe("itemSchema", () => {
	const validItem = {
		ean: "1234567890123",
		name: "Test Product",
		vat_rate: 2,
		unit_of_measure: "ks",
		sale_price_group1: 100,
		sale_price_group2: 100,
		sale_price_group3: 100,
		sale_price_group4: 100,
	} as Item;

	describe("required fields", () => {
		it("should pass with all required fields", () => {
			const result = itemSchema.safeParse(validItem);
			expect(result.success).toBe(true);
		});

		it("should fail without ean", () => {
			const { ean, ...without } = validItem;
			const result = itemSchema.safeParse(without);
			expect(result.success).toBe(false);
		});

		it("should fail without name", () => {
			const { name, ...without } = validItem;
			const result = itemSchema.safeParse(without);
			expect(result.success).toBe(false);
		});

		it("should fail without unit_of_measure", () => {
			const { unit_of_measure, ...without } = validItem;
			const result = itemSchema.safeParse(without);
			expect(result.success).toBe(false);
		});

		it("should fail without vat_rate", () => {
			const { vat_rate, ...without } = validItem;
			const result = itemSchema.safeParse(without);
			expect(result.success).toBe(false);
		});
	});

	describe("ean validation", () => {
		it("should accept 13 character EAN", () => {
			const result = itemSchema.safeParse({
				...validItem,
				ean: "1234567890123",
			});
			expect(result.success).toBe(true);
		});

		it("should accept shorter EAN codes", () => {
			const result = itemSchema.safeParse({ ...validItem, ean: "12345" });
			expect(result.success).toBe(true);
		});

		it("should reject empty EAN", () => {
			const result = itemSchema.safeParse({ ...validItem, ean: "" });
			expect(result.success).toBe(false);
		});

		it("should reject EAN over 50 characters", () => {
			const longEan = "1".repeat(51);
			const result = itemSchema.safeParse({ ...validItem, ean: longEan });
			expect(result.success).toBe(false);
		});
	});

	describe("name validation", () => {
		it("should require at least 1 character", () => {
			const result = itemSchema.safeParse({ ...validItem, name: "" });
			expect(result.success).toBe(false);
		});

		it("should accept names up to 200 characters", () => {
			const longName = "A".repeat(200);
			const result = itemSchema.safeParse({ ...validItem, name: longName });
			expect(result.success).toBe(true);
		});

		it("should reject names over 200 characters", () => {
			const longName = "A".repeat(201);
			const result = itemSchema.safeParse({ ...validItem, name: longName });
			expect(result.success).toBe(false);
		});
	});

	describe("vat_rate validation", () => {
		it("should accept numeric vat rates", () => {
			for (let rate of [0, 12, 21]) {
				const result = itemSchema.safeParse({ ...validItem, vat_rate: rate });
				expect(result.success).toBe(true);
			}
		});

		it("should convert string vat_rate to number", () => {
			const result = itemSchema.safeParse({ ...validItem, vat_rate: "21" });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.vat_rate).toBe(21);
			}
		});
	});

	describe("unit_of_measure validation", () => {
		it("should accept valid units", () => {
			const units = ["ks", "kg", "l", "m", "m2", "m3"];
			for (let unit of units) {
				const result = itemSchema.safeParse({
					...validItem,
					unit_of_measure: unit,
				});
				expect(result.success).toBe(true);
			}
		});

		it("should require at least 1 character", () => {
			const result = itemSchema.safeParse({
				...validItem,
				unit_of_measure: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject units over 20 characters", () => {
			const longUnit = "A".repeat(21);
			const result = itemSchema.safeParse({
				...validItem,
				unit_of_measure: longUnit,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("price validation", () => {
		it("should accept positive prices", () => {
			const result = itemSchema.safeParse({
				...validItem,
				sale_price_group1: 100.5,
				sale_price_group2: 95.0,
				sale_price_group3: 90.25,
				sale_price_group4: 85.75,
			});
			expect(result.success).toBe(true);
		});

		it("should accept zero prices", () => {
			const result = itemSchema.safeParse({
				...validItem,
				sale_price_group1: 0,
				sale_price_group2: 0,
				sale_price_group3: 0,
				sale_price_group4: 0,
			});
			expect(result.success).toBe(true);
		});

		it("should reject negative prices", () => {
			const result = itemSchema.safeParse({
				...validItem,
				sale_price_group1: -10,
			});
			expect(result.success).toBe(false);
		});

		it("should convert string prices to numbers", () => {
			const result = itemSchema.safeParse({
				...validItem,
				sale_price_group1: "100.50",
				sale_price_group2: "95",
				sale_price_group3: "90.25",
				sale_price_group4: "85.75",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.sale_price_group1).toBe(100.5);
				expect(result.data.sale_price_group2).toBe(95);
			}
		});
	});

	describe("optional fields", () => {
		it("should accept undefined category", () => {
			const result = itemSchema.safeParse({
				...validItem,
				category: undefined,
			});
			expect(result.success).toBe(true);
		});

		it("should accept empty string category", () => {
			const result = itemSchema.safeParse({
				...validItem,
				category: "",
			});
			expect(result.success).toBe(true);
		});

		it("should reject category over 100 characters", () => {
			const longCategory = "A".repeat(101);
			const result = itemSchema.safeParse({
				...validItem,
				category: longCategory,
			});
			expect(result.success).toBe(false);
		});

		it("should accept undefined note", () => {
			const result = itemSchema.safeParse({
				...validItem,
				note: undefined,
			});
			expect(result.success).toBe(true);
		});

		it("should reject note over 500 characters", () => {
			const longNote = "A".repeat(501);
			const result = itemSchema.safeParse({
				...validItem,
				note: longNote,
			});
			expect(result.success).toBe(false);
		});
	});
});
