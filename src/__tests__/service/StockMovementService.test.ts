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
import { getSignedAmount } from "../../utils/typeConverterUtils";

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

	describe("shouldSetResetPoint", () => {
		// Seed 10 units of stock via a purchase invoice
		const seedStock = async (amount: number) => {
			await invoiceService.create({
				prefix: "INV",
				number: "BUY-001",
				type: 1,
				date_issue: "2024-01-15",
				ico: "12345678",
				modifier: 1,
			});
			await stockMovementService.create({
				invoice_prefix: "INV",
				invoice_number: "BUY-001",
				item_ean: "1234567890123",
				amount: String(amount),
				price_per_unit: "50.00",
				vat_rate: 2,
			});
		};

		it("should flag reset when a sale drives stock from positive to zero", async () => {
			await seedStock(10);

			// The UI must pass the SIGNED amount for sales (types 3 & 4).
			// getSignedAmount(10, 3) => "-10", so 10 + (-10) = 0 crosses to <= 0.
			const signed = getSignedAmount(10, 3);
			expect(signed).toBe("-10");

			const result = await stockMovementService.shouldSetResetPoint(
				"1234567890123",
				signed,
			);
			expect(result).toBe(true);
		});

		it("should flag reset when a sale drives stock negative", async () => {
			await seedStock(10);

			const result = await stockMovementService.shouldSetResetPoint(
				"1234567890123",
				getSignedAmount(15, 4),
			);
			expect(result).toBe(true);
		});

		it("should NOT flag reset when a sale leaves stock positive", async () => {
			await seedStock(10);

			const result = await stockMovementService.shouldSetResetPoint(
				"1234567890123",
				getSignedAmount(5, 3),
			);
			expect(result).toBe(false);
		});

		it("regression: unsigned sale amount would never flag a reset", async () => {
			await seedStock(10);

			// Passing the raw positive quantity (the old bug) makes stock grow,
			// so the crossing to <= 0 is never detected.
			const result = await stockMovementService.shouldSetResetPoint(
				"1234567890123",
				"10",
			);
			expect(result).toBe(false);
		});
	});
});
