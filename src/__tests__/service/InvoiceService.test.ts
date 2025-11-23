import { describe, it, expect, beforeEach } from "vitest";
import { InvoiceService } from "../../service/InvoiceService";
import { ContactService } from "../../service/ContactService";
import type {
	CreateInvoiceInput,
	CreateContactInput,
} from "../../types/database";

describe("InvoiceService", () => {
	let invoiceService: InvoiceService;
	let contactService: ContactService;

	beforeEach(async () => {
		invoiceService = new InvoiceService();
		contactService = new ContactService();

		const testContact: CreateContactInput = {
			ico: "12345678",
			modifier: 1,
			company_name: "Test Company",
			is_supplier: true,
			is_customer: false,
			price_group: 1,
		};

		await contactService.create(testContact);
	});

	describe("create", () => {
		it("should create a new invoice", async () => {
			const invoice: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-001",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			};

			const result = await invoiceService.create(invoice);

			expect(result.changes).toBe(1);
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
				note: "Test note",
				ico: "12345678",
				modifier: 1,
				dic: "CZ12345678",
				company_name: "Test Company",
				bank_account: "1234567890/0800",
				street: "Test Street",
				city: "Prague",
				postal_code: "12000",
				phone: "+420123456789",
				email: "test@example.com",
			};

			const result = await invoiceService.create(invoice);

			expect(result.changes).toBe(1);

			const retrieved = await invoiceService.getOne("INV", "INV-002");
			expect(retrieved?.variable_symbol).toBe("123456");
			expect(retrieved?.note).toBe("Test note");
		});

		it("should throw error for duplicate invoice number", async () => {
			const invoice: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-003",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			};

			await invoiceService.create(invoice);

			await expect(invoiceService.create(invoice)).rejects.toThrow();
		});

		it("should accept all valid invoice types (1-5)", async () => {
			for (let type = 1; type <= 5; type++) {
				const invoice: CreateInvoiceInput = {
					prefix: "INV",
					number: `INV-TYPE-${type}`,
					type,
					date_issue: "2024-01-15",
					ico: "12345678",
					modifier: 1,
				};

				const result = await invoiceService.create(invoice);
				expect(result.changes).toBe(1);
			}
		});
	});

	describe("getAll", () => {
		it("should return empty array when no invoices exist", async () => {
			const invoices = await invoiceService.getAll();

			expect(invoices).toEqual([]);
		});

		it("should return all invoices", async () => {
			const invoice1: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-010",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			};

			const invoice2: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-011",
				type: 3,
				date_issue: "2024-01-16",
				ico: "12345678",
				modifier: 1,
			};

			await invoiceService.create(invoice1);
			await invoiceService.create(invoice2);

			const invoices = await invoiceService.getAll();

			expect(invoices).toHaveLength(2);
		});
	});

	describe("getOne", () => {
		it("should return undefined for non-existent invoice", async () => {
			const invoice = await invoiceService.getOne("INV", "NONEXISTENT");

			expect(invoice).toBeUndefined();
		});

		it("should return invoice by number", async () => {
			const newInvoice: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-012",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			};

			await invoiceService.create(newInvoice);

			const invoice = await invoiceService.getOne("INV", "INV-012");

			expect(invoice).toBeDefined();
			expect(invoice?.number).toBe("INV-012");
			expect(invoice?.type).toBe(1);
		});
	});

	describe("update", () => {
		it("should update invoice fields", async () => {
			const original: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-013",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			};

			await invoiceService.create(original);

			const updates = {
				type: 2,
				note: "Updated note",
				variable_symbol: "999999",
			};

			const result = await invoiceService.update("INV", "INV-013", updates);

			expect(result.changes).toBe(1);

			const updated = await invoiceService.getOne("INV", "INV-013");
			expect(updated?.type).toBe(2);
			expect(updated?.note).toBe("Updated note");
			expect(updated?.variable_symbol).toBe("999999");
		});

		it("should throw error when no fields to update", async () => {
			const original: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-014",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			};

			await invoiceService.create(original);

			await expect(invoiceService.update("INV", "INV-014", {})).rejects.toThrow(
				"No fields to update",
			);
		});
	});

	describe("delete", () => {
		it("should delete existing invoice", async () => {
			const invoice: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-015",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			};

			await invoiceService.create(invoice);

			const result = await invoiceService.delete("INV", "INV-015");

			expect(result.changes).toBe(1);

			const deleted = await invoiceService.getOne("INV", "INV-015");
			expect(deleted).toBeUndefined();
		});
	});
});
