import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { invoiceQueries } from "../../main/queries/invoices";
import { serializeInvoice } from "../../utils/typeConverterUtils";
import { itemQueries, stockMovementQueries } from "../../main/queries";

describe("invoiceQueries", () => {
	let db: Database.Database;

	beforeEach(() => {
		db = new Database(":memory:");
		db.exec(itemQueries.createTable);
		db.exec(stockMovementQueries.createTable);
		db.exec(invoiceQueries.createTable);
	});

	describe("getAll", () => {
		it("should return empty array when no invoices exist", () => {
			const result = db.prepare(invoiceQueries.getAll).all();
			expect(result).toEqual([]);
		});

		it("should return all invoices ordered by date_issue DESC and number DESC", () => {
			const insert = db.prepare(invoiceQueries.create);

			insert.run(
				serializeInvoice({
					prefix: "INV",
					number: "INV001",
					type: 1,
					date_issue: "2024-01-15",
				}),
			);

			insert.run(
				serializeInvoice({
					prefix: "INV",
					number: "INV002",
					type: 1,
					date_issue: "2024-01-20",
				}),
			);

			insert.run(
				serializeInvoice({
					prefix: "INV",
					number: "INV003",
					type: 1,
					date_issue: "2024-01-20",
				}),
			);

			const results = db.prepare(invoiceQueries.getAll).all();

			expect(results).toHaveLength(3);
			expect(results[0].number).toBe("INV003");
			expect(results[1].number).toBe("INV002");
			expect(results[2].number).toBe("INV001");
		});
	});

	describe("getOne", () => {
		it("should return undefined when invoice does not exist", () => {
			const result = db.prepare(invoiceQueries.getOne).get("INV", "INV999");
			expect(result).toBeUndefined();
		});

		it("should return invoice by number", () => {
			const insert = db.prepare(invoiceQueries.create);

			insert.run(
				serializeInvoice({
					prefix: "INV",
					number: "INV001",
					type: 1,
					date_issue: "2024-01-15",
					company_name: "Test Company",
				}),
			);

			const result = db.prepare(invoiceQueries.getOne).get("INV", "INV001");

			expect(result).toBeDefined();
			expect(result.number).toBe("INV001");
			expect(result.company_name).toBe("Test Company");
		});
	});

	describe("create", () => {
		it("should insert new invoice with all fields", () => {
			const insert = db.prepare(invoiceQueries.create);

			const result = insert.run(
				serializeInvoice({
					prefix: "INV",
					number: "INV001",
					type: 1,
					payment_method: 1,
					date_issue: "2024-01-15",
					date_tax: "2024-01-15",
					date_due: "2024-02-15",
					variable_symbol: "2024001",
					note: "Test note",
					ico: "12345678",
					modifier: 1,
					dic: "CZ12345678",
					company_name: "Test Company",
					bank_account: "123456-1234567890/0100",
					street: "123 Main St",
					city: "Prague",
					postal_code: "11000",
					phone: "+420123456789",
					email: "test@example.com",
				}),
			);

			expect(result.changes).toBe(1);

			const check = db.prepare(invoiceQueries.getOne).get("INV", "INV001");
			expect(check.number).toBe("INV001");
			expect(check.company_name).toBe("Test Company");
			expect(check.email).toBe("test@example.com");
		});

		it("should insert invoice with only required fields", () => {
			const insert = db.prepare(invoiceQueries.create);

			const result = insert.run(
				serializeInvoice({
					prefix: "INV",
					number: "INV001",
					type: 1,
					date_issue: "2024-01-15",
				}),
			);

			expect(result.changes).toBe(1);

			const check = db.prepare(invoiceQueries.getOne).get("INV", "INV001");
			expect(check.number).toBe("INV001");
			expect(check.type).toBe(1);
			expect(check.payment_method).toBeNull();
			expect(check.company_name).toBeNull();
		});
	});

	describe("delete", () => {
		it("should delete invoice by number", () => {
			const insert = db.prepare(invoiceQueries.create);

			insert.run(
				serializeInvoice({
					prefix: "INV",
					number: "INV001",
					type: 1,
					date_issue: "2024-01-15",
				}),
			);

			const deleteStmt = db.prepare(invoiceQueries.delete);
			const result = deleteStmt.run("INV", "INV001");

			expect(result.changes).toBe(1);

			const check = db.prepare(invoiceQueries.getOne).get("INV", "INV001");
			expect(check).toBeUndefined();
		});

		it("should return 0 changes when invoice does not exist", () => {
			const deleteStmt = db.prepare(invoiceQueries.delete);
			const result = deleteStmt.run("INV", "INV999");

			expect(result.changes).toBe(0);
		});
	});

	describe("type constraint", () => {
		it("should accept type values 1-5", () => {
			const insert = db.prepare(invoiceQueries.create);

			for (let i = 1; i <= 5; i++) {
				expect(() => {
					insert.run(
						serializeInvoice({
							prefix: "INV",
							number: `INV00${i}`,
							type: i,
							date_issue: "2024-01-15",
						}),
					);
				}).not.toThrow();
			}
		});

		it("should reject type values outside 1-5 range", () => {
			const insert = db.prepare(invoiceQueries.create);

			expect(() => {
				insert.run(
					serializeInvoice({
						prefix: "INV",
						number: "INV001",
						type: 0,
						date_issue: "2024-01-15",
					}),
				);
			}).toThrow();

			expect(() => {
				insert.run(
					serializeInvoice({
						prefix: "INV",
						number: "INV002",
						type: 6,
						date_issue: "2024-01-15",
					}),
				);
			}).toThrow();
		});
	});

	describe("payment_method constraint", () => {
		it("should accept payment_method values 0, 1, or null", () => {
			const insert = db.prepare(invoiceQueries.create);

			expect(() => {
				insert.run(
					serializeInvoice({
						prefix: "INV",
						number: "INV001",
						type: 1,
						payment_method: 0,
						date_issue: "2024-01-15",
					}),
				);
			}).not.toThrow();

			expect(() => {
				insert.run(
					serializeInvoice({
						prefix: "INV",
						number: "INV002",
						type: 1,
						payment_method: 1,
						date_issue: "2024-01-15",
					}),
				);
			}).not.toThrow();

			expect(() => {
				insert.run(
					serializeInvoice({
						prefix: "INV",
						number: "INV003",
						type: 1,
						payment_method: undefined,
						date_issue: "2024-01-15",
					}),
				);
			}).not.toThrow();
		});

		it("should reject invalid payment_method values", () => {
			const insert = db.prepare(invoiceQueries.create);

			expect(() => {
				insert.run(
					serializeInvoice({
						prefix: "INV",
						number: "INV001",
						type: 1,
						payment_method: 2,
						date_issue: "2024-01-15",
					}),
				);
			}).toThrow();

			expect(() => {
				insert.run(
					serializeInvoice({
						prefix: "INV",
						number: "INV002",
						type: 1,
						payment_method: -1,
						date_issue: "2024-01-15",
					}),
				);
			}).toThrow();
		});
	});

	describe("primary key constraint", () => {
		it("should reject duplicate invoice number", () => {
			const insert = db.prepare(invoiceQueries.create);

			insert.run(
				serializeInvoice({
					prefix: "INV",
					number: "INV001",
					type: 1,
					date_issue: "2024-01-15",
				}),
			);

			expect(() => {
				insert.run(
					serializeInvoice({
						prefix: "INV",
						number: "INV001",
						type: 2,
						date_issue: "2024-01-20",
					}),
				);
			}).toThrow();
		});
	});

	describe("optional date fields", () => {
		it("should allow null for date_tax and date_due", () => {
			const insert = db.prepare(invoiceQueries.create);

			const result = insert.run(
				serializeInvoice({
					prefix: "INV",
					number: "INV001",
					type: 1,
					date_issue: "2024-01-15",
					date_tax: undefined,
					date_due: undefined,
				}),
			);

			expect(result.changes).toBe(1);

			const check = db.prepare(invoiceQueries.getOne).get("INV", "INV001");
			expect(check.date_tax).toBeNull();
			expect(check.date_due).toBeNull();
		});

		it("should store date_tax and date_due when provided", () => {
			const insert = db.prepare(invoiceQueries.create);

			insert.run(
				serializeInvoice({
					prefix: "INV",
					number: "INV001",
					type: 1,
					date_issue: "2024-01-15",
					date_tax: "2024-01-16",
					date_due: "2024-02-15",
				}),
			);

			const check = db.prepare(invoiceQueries.getOne).get("INV", "INV001");
			expect(check.date_tax).toBe("2024-01-16");
			expect(check.date_due).toBe("2024-02-15");
		});
	});
});
