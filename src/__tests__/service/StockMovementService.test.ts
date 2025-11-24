import { describe, it, expect, beforeEach } from "vitest";
import { StockMovementService } from "../../service/StockMovementService";
import { ItemService } from "../../service/ItemService";
import { InvoiceService } from "../../service/InvoiceService";
import { ContactService } from "../../service/ContactService";
import type {
	CreateItemInput,
	CreateInvoiceInput,
	CreateContactInput,
} from "../../types/database";

describe("StockMovementService", () => {
	let stockMovementService: StockMovementService;
	let itemService: ItemService;
	let invoiceService: InvoiceService;
	let contactService: ContactService;

	beforeEach(async () => {
		stockMovementService = new StockMovementService();
		itemService = new ItemService();
		invoiceService = new InvoiceService();
		contactService = new ContactService();

		const testItem: CreateItemInput = {
			ean: "1234567890123",
			name: "Test Item",
			vat_rate: 2,
			unit_of_measure: "ks",
			sale_price_group1: 100,
			sale_price_group2: 100,
			sale_price_group3: 100,
			sale_price_group4: 100,
		};

		const testContact: CreateContactInput = {
			ico: "12345678",
			modifier: 1,
			company_name: "Test Supplier",
			is_supplier: true,
			is_customer: false,
			price_group: 1,
		};

		await itemService.create(testItem);
		await contactService.create(testContact);
	});

	describe("getStockAmountByItem", () => {
		it("should return 0 for item with no movements", async () => {
			const amount =
				await stockMovementService.getStockAmountByItem("1234567890123");
			expect(amount).toBe(0);
		});

		it("should calculate total stock amount", async () => {
			const invoice1: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-012",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			};

			const invoice2: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-013",
				type: 1,
				date_issue: "2024-01-16",
				ico: "12345678",
				modifier: 1,
			};

			await invoiceService.create(invoice1);
			await invoiceService.create(invoice2);

			await stockMovementService.create({
				invoice_prefix: "INV",
				invoice_number: "INV-012",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "50.00",
				vat_rate: 2,
			});

			await stockMovementService.create({
				invoice_prefix: "INV",
				invoice_number: "INV-013",
				item_ean: "1234567890123",
				amount: "20",
				price_per_unit: "45.00",
				vat_rate: 2,
			});

			const amount =
				await stockMovementService.getStockAmountByItem("1234567890123");
			expect(amount).toBe(30);
		});
	});

	describe("getAverageBuyPriceByItem", () => {
		it("should return 0 for item with no purchase movements", async () => {
			const avgPrice =
				await stockMovementService.getAverageBuyPriceByItem("1234567890123");
			expect(avgPrice).toBe(0);
		});

		it("should calculate average buy price from purchase invoices only", async () => {
			const purchaseInvoice1: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-016",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			};

			const purchaseInvoice2: CreateInvoiceInput = {
				prefix: "INV",
				number: "INV-017",
				type: 2,
				date_issue: "2024-01-16",
				ico: "12345678",
				modifier: 1,
			};

			await invoiceService.create(purchaseInvoice1);
			await invoiceService.create(purchaseInvoice2);

			await stockMovementService.create({
				invoice_prefix: "INV",
				invoice_number: "INV-016",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "40.00",
				vat_rate: 2,
			});

			await stockMovementService.create({
				invoice_prefix: "INV",
				invoice_number: "INV-017",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "60.00",
				vat_rate: 2,
			});

			const avgPrice =
				await stockMovementService.getAverageBuyPriceByItem("1234567890123");
			expect(avgPrice).toBe(50);
		});
	});
});
