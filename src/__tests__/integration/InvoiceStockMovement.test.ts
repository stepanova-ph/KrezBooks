import { describe, it, expect, beforeEach } from "vitest";
import { handleIpcRequest } from "../../main/ipcWrapper";
import {
	contactService,
	itemService,
	invoiceService,
	stockMovementService,
} from "../../service";
import type {
	CreateContactInput,
	CreateItemInput,
	CreateInvoiceInput,
	CreateStockMovementInput,
} from "../../types/database";

// Helper functions to create test data
async function createTestContact(
	ico: string = "12345678",
	modifier: number = 1,
) {
	const contact: CreateContactInput = {
		ico,
		modifier,
		company_name: `Test Company ${ico}`,
		is_supplier: true,
		is_customer: false,
		price_group: 1,
	};
	await contactService.create(contact);
	return contact;
}

async function createTestItem(ean: string = "1234567890123") {
	const item: CreateItemInput = {
		ean,
		name: `Test Item ${ean}`,
		vat_rate: 2,
		unit_of_measure: "ks",
		sale_price_group1: 100,
		sale_price_group2: 90,
		sale_price_group3: 80,
		sale_price_group4: 70,
	};
	await itemService.create(item);
	return item;
}

describe("Invoice and Stock Movement Integration", () => {
	beforeEach(async () => {
		// Database resets automatically in tests
		// Create base test data needed for all tests
		await createTestContact();
		await createTestItem();
	});

	describe("Invoice Creation", () => {
		it("should create invoice via IPC wrapper", async () => {
			const invoice: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-001",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			};

			const response = await handleIpcRequest(() =>
				invoiceService.create(invoice),
			);

			expect(response.success).toBe(true);
			expect(response.data?.changes).toBe(1);

			// Verify it's in the database
			const retrieved = await invoiceService.getOne("INV", "INV-001");
			expect(retrieved).toBeDefined();
			expect(retrieved?.number).toBe("INV-001");
			expect(retrieved?.type).toBe(1);
			expect(retrieved?.ico).toBe("12345678");
		});

		it("should create invoice with all optional fields", async () => {
			const invoice: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-002",
				type: 2,
				payment_method: 1,
				date_issue: "2024-01-15",
				date_tax: "2024-01-15",
				date_due: "2024-02-15",
				variable_symbol: "123456",
				note: "Test invoice",
				ico: "12345678",
				modifier: 1,
			};

			const response = await handleIpcRequest(() =>
				invoiceService.create(invoice),
			);

			expect(response.success).toBe(true);

			const retrieved = await invoiceService.getOne("INV", "INV-002");
			expect(retrieved).toMatchObject({
				prefix: "INV",
				number: "INV-002",
				type: 2,
				payment_method: 1,
				variable_symbol: "123456",
				note: "Test invoice",
			});
		});

		it("should fail when creating duplicate invoice", async () => {
			const invoice: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-003",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			};

			await invoiceService.create(invoice);

			const response = await handleIpcRequest(() =>
				invoiceService.create(invoice),
			);

			expect(response.success).toBe(false);
			expect(response.error).toBeDefined();
		});
	});

	describe("Stock Movement Creation", () => {
		beforeEach(async () => {
			// Create invoice for stock movements
			await invoiceService.create({
				prefix: "INV",
				number: "INV-100",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			});
		});

		it("should create stock movement via IPC wrapper", async () => {
			const movement: CreateStockMovementInput = {
					invoice_prefix: "INV",
					invoice_number: "INV-100",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "50.00",
				vat_rate: 2,
			};

			const response = await handleIpcRequest(() =>
				stockMovementService.create(movement),
			);

			expect(response.success).toBe(true);
			expect(response.data?.changes).toBe(1);

			// Verify it's in the database
			const retrieved = await stockMovementService.getOne(
				"INV",
				"INV-100",
				"1234567890123",
			);
			expect(retrieved).toBeDefined();
			expect(retrieved?.invoice_number).toBe("INV-100");
			expect(retrieved?.item_ean).toBe("1234567890123");
			expect(retrieved?.amount).toBe("10");
		});

		it("should fail when creating movement with non-existent invoice", async () => {
			const movement: CreateStockMovementInput = {
					invoice_prefix: "INV",
					invoice_number: "INV-999",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "50.00",
				vat_rate: 2,
			};

			const response = await handleIpcRequest(() =>
				stockMovementService.create(movement),
			);

			expect(response.success).toBe(false);
			expect(response.error).toBeDefined();
		});

		it("should fail when creating movement with non-existent item", async () => {
			const movement: CreateStockMovementInput = {
					invoice_prefix: "INV",
					invoice_number: "INV-100",
				item_ean: "9999999999999",
				amount: "10",
				price_per_unit: "50.00",
				vat_rate: 2,
			};

			const response = await handleIpcRequest(() =>
				stockMovementService.create(movement),
			);

			expect(response.success).toBe(false);
			expect(response.error).toBeDefined();
		});
	});

	describe("Complete Invoice with Stock Movements", () => {
		it("should create invoice and multiple stock movements", async () => {
			// Create additional items
			await createTestItem("2222222222222");
			await createTestItem("3333333333333");

			// Create invoice
			const invoice: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-200",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			};

			const invoiceResponse = await handleIpcRequest(() =>
				invoiceService.create(invoice),
			);
			expect(invoiceResponse.success).toBe(true);

			// Create multiple stock movements
			const movements: CreateStockMovementInput[] = [
				{
					invoice_prefix: "INV",
					invoice_number: "INV-200",
					item_ean: "1234567890123",
					amount: "10",
					price_per_unit: "50.00",
					vat_rate: 2,
				},
				{
					invoice_prefix: "INV",
					invoice_number: "INV-200",
					item_ean: "2222222222222",
					amount: "5",
					price_per_unit: "100.00",
					vat_rate: 2,
				},
				{
					invoice_prefix: "INV",
					invoice_number: "INV-200",
					item_ean: "3333333333333",
					amount: "15",
					price_per_unit: "30.00",
					vat_rate: 1,
				},
			];

			for (const movement of movements) {
				const response = await handleIpcRequest(() =>
					stockMovementService.create(movement),
				);
				expect(response.success).toBe(true);
			}

			// Verify all movements are linked to the invoice
			const invoiceMovements =
				await stockMovementService.getByInvoice("INV", "INV-200");
			expect(invoiceMovements).toHaveLength(3);
			expect(invoiceMovements.map((m) => m.item_ean).sort()).toEqual([
				"1234567890123",
				"2222222222222",
				"3333333333333",
			]);
		});

		it("should delete invoice and cascade delete stock movements", async () => {
			// Create invoice with movements
			await invoiceService.create({
				prefix: "INV",
				number: "INV-300",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			});

			await stockMovementService.create({
					invoice_prefix: "INV",
					invoice_number: "INV-300",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "50.00",
				vat_rate: 2,
			});

			// Verify movement exists
			let movements = await stockMovementService.getByInvoice("INV", "INV-300");
			expect(movements).toHaveLength(1);

			// Delete invoice
			const deleteResponse = await handleIpcRequest(() =>
				invoiceService.delete("INV", "INV-300"),
			);
			expect(deleteResponse.success).toBe(true);

			// Verify movement is also deleted (due to CASCADE)
			movements = await stockMovementService.getByInvoice("INV", "INV-300");
			expect(movements).toHaveLength(0);
		});
	});

	describe("Stock Calculations", () => {
		beforeEach(async () => {
			// Create multiple invoices with stock movements
			await invoiceService.create({
				prefix: "INV",
				number: "INV-401",
				type: 1,
				date_issue: "2024-01-10",
				ico: "12345678",
				modifier: 1,
			});

			await invoiceService.create({
				prefix: "INV",
				number: "INV-402",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			});

			await stockMovementService.create({
					invoice_prefix: "INV",
					invoice_number: "INV-401",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "50.00",
				vat_rate: 2,
			});

			await stockMovementService.create({
					invoice_prefix: "INV",
					invoice_number: "INV-402",
				item_ean: "1234567890123",
				amount: "20",
				price_per_unit: "60.00",
				vat_rate: 2,
			});
		});

		it("should calculate total stock amount", async () => {
			const amount =
				await stockMovementService.getStockAmountByItem("1234567890123");
			expect(amount).toBe(30);
		});

		it("should calculate average buy price", async () => {
			const avgPrice =
				await stockMovementService.getAverageBuyPriceByItem("1234567890123");
			// (10*50 + 20*60) / 30 = 1700/30 = 56.67
			expect(avgPrice).toBeCloseTo(56.67, 2);
		});

		it("should get last buy price", async () => {
			const lastPrice =
				await stockMovementService.getLastBuyPriceByItem("1234567890123");
			expect(lastPrice).toBe(60.0);
		});

		it("should return 0 for item with no movements", async () => {
			await createTestItem("9999999999999");

			const amount =
				await stockMovementService.getStockAmountByItem("9999999999999");
			expect(amount).toBe(0);

			const avgPrice =
				await stockMovementService.getAverageBuyPriceByItem("9999999999999");
			expect(avgPrice).toBe(0);

			const lastPrice =
				await stockMovementService.getLastBuyPriceByItem("9999999999999");
			expect(lastPrice).toBe(0);
		});
	});

	describe("Update Operations", () => {
		beforeEach(async () => {
			await invoiceService.create({
				prefix: "INV",
				number: "INV-500",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			});

			await stockMovementService.create({
					invoice_prefix: "INV",
					invoice_number: "INV-500",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "50.00",
				vat_rate: 2,
			});
		});

		it("should update invoice via IPC wrapper", async () => {
			const updates = {
				note: "Updated note",
				variable_symbol: "999999",
			};

			const response = await handleIpcRequest(() =>
				invoiceService.update("INV", "INV-500", updates),
			);

			expect(response.success).toBe(true);
			expect(response.data?.changes).toBe(1);

			const updated = await invoiceService.getOne("INV", "INV-500");
			expect(updated?.note).toBe("Updated note");
			expect(updated?.variable_symbol).toBe("999999");
		});

		it("should update stock movement via IPC wrapper", async () => {
			const updates = {
				amount: "15",
				price_per_unit: "55.00",
			};

			const response = await handleIpcRequest(() =>
				stockMovementService.update("INV", "INV-500", "1234567890123", updates),
			);

			expect(response.success).toBe(true);
			expect(response.data?.changes).toBe(1);

			const updated = await stockMovementService.getOne(
				"INV",
				"INV-500",
				"1234567890123",
			);
			expect(updated?.amount).toBe("15");
			expect(updated?.price_per_unit).toBe("55.00");
		});
	});

	describe("Error Handling", () => {
		it("should handle invoice not found on update", async () => {
			const response = await handleIpcRequest(() =>
				invoiceService.update("INV", "INV-999", { note: "test" }),
			);

			expect(response.success).toBe(false);
			expect(response.error).toBeDefined();
		});

		it("should handle invoice not found on delete", async () => {
			const response = await handleIpcRequest(() =>
				invoiceService.delete("INV", "INV-999"),
			);

			expect(response.success).toBe(false);
			expect(response.error).toBeDefined();
		});

		it("should handle stock movement not found on update", async () => {
			const response = await handleIpcRequest(() =>
				stockMovementService.update("INV", "INV-999", "1234567890123", {
					amount: "10",
				}),
			);

			expect(response.success).toBe(false);
			expect(response.error).toBeDefined();
		});
	});
});
