import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { invoiceQueries } from "../../main/queries/invoices";
import { itemQueries } from "../../main/queries/items";
import { stockMovementQueries } from "../../main/queries/stockMovements";

describe("Concurrent Operations", () => {
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

		// Create test invoice
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
	});

	afterEach(() => {
		db.close();
	});

	describe("Transaction Isolation", () => {
		it("should handle concurrent stock movements with transactions", async () => {
			// Create multiple invoices for unique movements
			for (let i = 2; i <= 10; i++) {
				db.prepare(invoiceQueries.create).run({
					prefix: "INV",
					number: i.toString().padStart(3, "0"),
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
			}

			const promises = [];

			for (let i = 1; i <= 10; i++) {
				promises.push(
					new Promise<void>((resolve) => {
						const transaction = db.transaction(() => {
							db.prepare(stockMovementQueries.create).run({
								invoice_prefix: "INV",
								invoice_number: i.toString().padStart(3, "0"),
								item_ean: "1234567890123",
								amount: "1",
								price_per_unit: "100.00",
								vat_rate: 1,
								reset_point: 0,
							});
						});

						transaction();
						resolve();
					}),
				);
			}

			await Promise.all(promises);

			const movements = db.prepare("SELECT * FROM stock_movements").all();
			expect(movements.length).toBe(10);
		});

		it("should rollback failed transaction without affecting other operations", () => {
			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "10",
				price_per_unit: "100.00",
				vat_rate: 1,
				reset_point: 0,
			});

			expect(() => {
				const transaction = db.transaction(() => {
					db.prepare(stockMovementQueries.create).run({
						invoice_prefix: "INV",
						invoice_number: "001",
						item_ean: "1234567890123",
						amount: "5",
						price_per_unit: "100.00",
						vat_rate: 1,
						reset_point: 0,
					});

					// This should fail - duplicate primary key
					db.prepare(stockMovementQueries.create).run({
						invoice_prefix: "INV",
						invoice_number: "001",
						item_ean: "1234567890123",
						amount: "3",
						price_per_unit: "100.00",
						vat_rate: 1,
						reset_point: 0,
					});
				});

				transaction();
			}).toThrow(/UNIQUE constraint failed/);

			// Should still have only the first movement
			const movements = db.prepare("SELECT * FROM stock_movements").all();
			expect(movements.length).toBe(1);
		});

		it("should handle nested transactions correctly", () => {
			const outerTransaction = db.transaction(() => {
				db.prepare(stockMovementQueries.create).run({
					invoice_prefix: "INV",
					invoice_number: "001",
					item_ean: "1234567890123",
					amount: "10",
					price_per_unit: "100.00",
					vat_rate: 1,
					reset_point: 0,
				});

				const innerTransaction = db.transaction(() => {
					db.prepare("UPDATE items SET name = ? WHERE ean = ?").run("Updated Name", "1234567890123");
				});

				innerTransaction();
			});

			outerTransaction();

			const movement = db.prepare("SELECT * FROM stock_movements").get();
			const item = db.prepare("SELECT * FROM items WHERE ean = ?").get("1234567890123") as { name: string };

			expect(movement).toBeDefined();
			expect(item.name).toBe("Updated Name");
		});
	});

	describe("Race Conditions", () => {
		it("should prevent duplicate invoice creation", async () => {
			const promises = [];
			let successCount = 0;
			let errorCount = 0;

			for (let i = 0; i < 5; i++) {
				promises.push(
					new Promise<void>((resolve) => {
						try {
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
							successCount++;
						} catch (e) {
							errorCount++;
						}
						resolve();
					}),
				);
			}

			await Promise.all(promises);

			expect(successCount).toBe(1);
			expect(errorCount).toBe(4);
		});

		it("should handle concurrent updates to same item", async () => {
			const promises = [];

			for (let i = 1; i <= 10; i++) {
				promises.push(
					new Promise<void>((resolve) => {
						db.prepare("UPDATE items SET name = ? WHERE ean = ?").run(`Name ${i}`, "1234567890123");
						resolve();
					}),
				);
			}

			await Promise.all(promises);

			const item = db.prepare("SELECT * FROM items WHERE ean = ?").get("1234567890123") as { name: string };
			expect(item.name).toMatch(/^Name \d+$/);
		});

		it("should handle concurrent stock calculations", async () => {
			// Create multiple invoices - first one already exists from beforeEach
			for (let i = 2; i <= 10; i++) {
				db.prepare(invoiceQueries.create).run({
					prefix: "INV",
					number: i.toString().padStart(3, "0"),
					type: i % 2 === 0 ? 1 : 2, // Alternate between purchase and sale
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
			}

			const promises = [];

			// Concurrent stock movements
			for (let i = 1; i <= 10; i++) {
				promises.push(
					new Promise<void>((resolve) => {
						db.prepare(stockMovementQueries.create).run({
							invoice_prefix: "INV",
							invoice_number: i.toString().padStart(3, "0"),
							item_ean: "1234567890123",
							amount: "10",
							price_per_unit: "100.00",
							vat_rate: 1,
							reset_point: 0,
						});
						resolve();
					}),
				);
			}

			await Promise.all(promises);

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

			// Invoice 001 (type 1): +10
			// Invoice 002 (type 1): +10
			// Invoice 003 (type 2): -10
			// Invoice 004 (type 1): +10
			// Invoice 005 (type 2): -10
			// Invoice 006 (type 1): +10
			// Invoice 007 (type 2): -10
			// Invoice 008 (type 1): +10
			// Invoice 009 (type 2): -10
			// Invoice 010 (type 1): +10
			// Total: 60 purchases - 40 sales = 20
			expect(stock.current_stock).toBe(20);
		});
	});

	describe("Batch Operations", () => {
		it("should handle bulk insert of invoices", () => {
			const startTime = Date.now();

			const insertMany = db.transaction((invoices: any[]) => {
				const stmt = db.prepare(invoiceQueries.create);
				for (const invoice of invoices) {
					stmt.run(invoice);
				}
			});

			const invoices = [];
			for (let i = 2; i <= 100; i++) {
				invoices.push({
					prefix: "INV",
					number: i.toString().padStart(3, "0"),
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
			}

			insertMany(invoices);

			const endTime = Date.now();
			const duration = endTime - startTime;

			const count = db.prepare("SELECT COUNT(*) as count FROM invoices").get() as { count: number };
			expect(count.count).toBe(100);
			expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
		});

		it("should handle bulk insert of stock movements", () => {
			// Create invoices first
			const invoiceTransaction = db.transaction((invoices: any[]) => {
				const stmt = db.prepare(invoiceQueries.create);
				for (const invoice of invoices) {
					stmt.run(invoice);
				}
			});

			const invoices = [];
			for (let i = 2; i <= 50; i++) {
				invoices.push({
					prefix: "INV",
					number: i.toString().padStart(3, "0"),
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
			}

			invoiceTransaction(invoices);

			// Bulk insert stock movements
			const movementTransaction = db.transaction((movements: any[]) => {
				const stmt = db.prepare(stockMovementQueries.create);
				for (const movement of movements) {
					stmt.run(movement);
				}
			});

			const movements = [];
			for (let i = 1; i <= 50; i++) {
				movements.push({
					invoice_prefix: "INV",
					invoice_number: i.toString().padStart(3, "0"),
					item_ean: "1234567890123",
					amount: "10",
					price_per_unit: "100.00",
					vat_rate: 1,
					reset_point: 0,
				});
			}

			movementTransaction(movements);

			const count = db.prepare("SELECT COUNT(*) as count FROM stock_movements").get() as { count: number };
			expect(count.count).toBe(50);
		});

		it("should handle bulk update efficiently", () => {
			// Create test data
			const insertTransaction = db.transaction(() => {
				for (let i = 2; i <= 100; i++) {
					db.prepare(itemQueries.create).run({
						ean: i.toString().padStart(13, "0"),
						category: null,
						name: `Item ${i}`,
						note: null,
						vat_rate: 1,
						unit_of_measure: "ks",
						sale_price_group1: "100",
						sale_price_group2: "100",
						sale_price_group3: "100",
						sale_price_group4: "100",
					});
				}
			});

			insertTransaction();

			const startTime = Date.now();

			// Bulk update
			const updateTransaction = db.transaction(() => {
				const stmt = db.prepare("UPDATE items SET sale_price_group1 = ? WHERE ean = ?");
				for (let i = 2; i <= 100; i++) {
					stmt.run("150", i.toString().padStart(13, "0"));
				}
			});

			updateTransaction();

			const endTime = Date.now();
			const duration = endTime - startTime;

			const items = db.prepare("SELECT * FROM items WHERE sale_price_group1 = ?").all("150");
			expect(items.length).toBe(99);
			expect(duration).toBeLessThan(500);
		});

		it("should handle bulk delete efficiently", () => {
			// Create test data
			const insertTransaction = db.transaction(() => {
				for (let i = 2; i <= 100; i++) {
					db.prepare(invoiceQueries.create).run({
						prefix: "INV",
						number: i.toString().padStart(3, "0"),
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
				}
			});

			insertTransaction();

			const startTime = Date.now();

			// Bulk delete
			const deleteTransaction = db.transaction(() => {
				db.prepare("DELETE FROM invoices WHERE type = ?").run(1);
			});

			deleteTransaction();

			const endTime = Date.now();
			const duration = endTime - startTime;

			const count = db.prepare("SELECT COUNT(*) as count FROM invoices").get() as { count: number };
			expect(count.count).toBe(0);
			expect(duration).toBeLessThan(500);
		});
	});

	describe("Lock and Deadlock Prevention", () => {
		it("should handle write-after-read scenarios", () => {
			const transaction = db.transaction(() => {
				// Read
				const item = db.prepare("SELECT * FROM items WHERE ean = ?").get("1234567890123");
				expect(item).toBeDefined();

				// Write
				db.prepare("UPDATE items SET name = ? WHERE ean = ?").run("Updated in transaction", "1234567890123");
			});

			transaction();

			const item = db.prepare("SELECT * FROM items WHERE ean = ?").get("1234567890123") as { name: string };
			expect(item.name).toBe("Updated in transaction");
		});

		it("should handle read-after-write scenarios", () => {
			const transaction = db.transaction(() => {
				// Write
				db.prepare("UPDATE items SET name = ? WHERE ean = ?").run("New Name", "1234567890123");

				// Read
				const item = db.prepare("SELECT * FROM items WHERE ean = ?").get("1234567890123") as { name: string };
				expect(item.name).toBe("New Name");
			});

			transaction();
		});

		it("should handle multiple table operations atomically", () => {
			const transaction = db.transaction(() => {
				// Create new invoice
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

				// Add stock movement
				db.prepare(stockMovementQueries.create).run({
					invoice_prefix: "INV",
					invoice_number: "002",
					item_ean: "1234567890123",
					amount: "50",
					price_per_unit: "100.00",
					vat_rate: 1,
					reset_point: 0,
				});

				// Update item
				db.prepare("UPDATE items SET name = ? WHERE ean = ?").run("Updated Item", "1234567890123");
			});

			transaction();

			const invoice = db.prepare("SELECT * FROM invoices WHERE prefix = ? AND number = ?").get("INV", "002");
			const movement = db
				.prepare("SELECT * FROM stock_movements WHERE invoice_prefix = ? AND invoice_number = ?")
				.get("INV", "002");
			const item = db.prepare("SELECT * FROM items WHERE ean = ?").get("1234567890123") as { name: string };

			expect(invoice).toBeDefined();
			expect(movement).toBeDefined();
			expect(item.name).toBe("Updated Item");
		});
	});

	describe("Stress Testing", () => {
		it("should handle 1000 invoice insertions", () => {
			const insertMany = db.transaction(() => {
				const stmt = db.prepare(invoiceQueries.create);
				for (let i = 2; i <= 1000; i++) {
					stmt.run({
						prefix: "INV",
						number: i.toString().padStart(4, "0"),
						type: (i % 5) + 1, // Cycle through types 1-5
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
				}
			});

			const startTime = Date.now();
			insertMany();
			const endTime = Date.now();

			const count = db.prepare("SELECT COUNT(*) as count FROM invoices").get() as { count: number };
			expect(count.count).toBe(1000);
			expect(endTime - startTime).toBeLessThan(2000);
		});

		it("should handle complex queries on large dataset", () => {
			// Setup large dataset
			const setup = db.transaction(() => {
				const invoiceStmt = db.prepare(invoiceQueries.create);
				const movementStmt = db.prepare(stockMovementQueries.create);

				for (let i = 2; i <= 500; i++) {
					invoiceStmt.run({
						prefix: "INV",
						number: i.toString().padStart(4, "0"),
						type: (i % 2) + 1, // Alternate between purchase and sale
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

					movementStmt.run({
						invoice_prefix: "INV",
						invoice_number: i.toString().padStart(4, "0"),
						item_ean: "1234567890123",
						amount: "10",
						price_per_unit: "100.00",
						vat_rate: 1,
						reset_point: 0,
					});
				}
			});

			setup();

			// Complex query
			const startTime = Date.now();
			const result = db
				.prepare(
					`
				SELECT
					i.type,
					COUNT(*) as count,
					SUM(CAST(sm.amount AS REAL)) as total_amount,
					AVG(CAST(sm.price_per_unit AS REAL)) as avg_price
				FROM stock_movements sm
				JOIN invoices i ON sm.invoice_prefix = i.prefix AND sm.invoice_number = i.number
				GROUP BY i.type
			`,
				)
				.all();
			const endTime = Date.now();

			expect(result.length).toBeGreaterThan(0);
			expect(endTime - startTime).toBeLessThan(100);
		});
	});

	describe("Error Recovery", () => {
		it("should recover from constraint violation in transaction", () => {
			expect(() => {
				const transaction = db.transaction(() => {
					db.prepare(stockMovementQueries.create).run({
						invoice_prefix: "INV",
						invoice_number: "001",
						item_ean: "1234567890123",
						amount: "10",
						price_per_unit: "100.00",
						vat_rate: 1,
						reset_point: 0,
					});

					// This will fail - duplicate
					db.prepare(stockMovementQueries.create).run({
						invoice_prefix: "INV",
						invoice_number: "001",
						item_ean: "1234567890123",
						amount: "20",
						price_per_unit: "100.00",
						vat_rate: 1,
						reset_point: 0,
					});
				});

				transaction();
			}).toThrow();

			// Database should still be usable
			const count = db.prepare("SELECT COUNT(*) as count FROM stock_movements").get() as { count: number };
			expect(count.count).toBe(0);

			// Can perform new operations
			db.prepare(stockMovementQueries.create).run({
				invoice_prefix: "INV",
				invoice_number: "001",
				item_ean: "1234567890123",
				amount: "15",
				price_per_unit: "100.00",
				vat_rate: 1,
				reset_point: 0,
			});

			const newCount = db.prepare("SELECT COUNT(*) as count FROM stock_movements").get() as { count: number };
			expect(newCount.count).toBe(1);
		});
	});
});
