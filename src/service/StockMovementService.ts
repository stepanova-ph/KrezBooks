import { stockMovementQueries } from "../main/queries/stockMovements";
import { getDatabase } from "../main/database";
import { StockMovement, CreateStockMovementInput } from "../types/database";
import {
	booleanToSQLiteInteger,
	sqliteIntegerToBoolean,
} from "../utils/typeConverterUtils";

export class StockMovementService {
	async getAll(): Promise<StockMovement[]> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.getAll);
		const movements = statement.all() as any[];
		return movements.map((m) => ({
			...m,
			reset_point: sqliteIntegerToBoolean(m.reset_point),
		}));
	}

	async getOne(
		invoicePrefix: string,
		invoiceNumber: string,
		itemEan: string,
	): Promise<StockMovement | undefined> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.getOne);
		const movement = statement.get(invoicePrefix, invoiceNumber, itemEan) as any;
		if (!movement) return undefined;
		return {
			...movement,
			reset_point: sqliteIntegerToBoolean(movement.reset_point),
		};
	}

	async getByInvoice(invoicePrefix: string, invoiceNumber: string): Promise<StockMovement[]> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.getByInvoice);
		const movements = statement.all(invoicePrefix, invoiceNumber) as any[];
		return movements.map((m) => ({
			...m,
			reset_point: sqliteIntegerToBoolean(m.reset_point),
		}));
	}

	async create(
		movement: CreateStockMovementInput,
	): Promise<{ changes: number }> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.create);

		const movementData = {
			invoice_prefix: movement.invoice_prefix,
			invoice_number: movement.invoice_number,
			item_ean: movement.item_ean,
			amount: movement.amount,
			price_per_unit: movement.price_per_unit,
			vat_rate: movement.vat_rate,
			reset_point: booleanToSQLiteInteger(movement.reset_point ?? false),
		};

		const result = statement.run(movementData);

		return {
			changes: result.changes,
		};
	}

	async update(
		invoicePrefix: string,
		invoiceNumber: string,
		itemEan: string,
		updates: Partial<StockMovement>,
	): Promise<{ changes: number }> {
		const db = getDatabase();

		const fieldsToUpdate = Object.keys(updates).filter(
			(key) =>
				key !== "invoice_prefix" && key !== "invoice_number" && key !== "item_ean" && key !== "created_at",
		);

		if (fieldsToUpdate.length === 0) {
			throw new Error("No fields to update");
		}

		const sql = this.buildUpdateQuery("stock_movements", fieldsToUpdate);
		const statement = db.prepare(sql);

		const updateData: any = {
			invoice_prefix: invoicePrefix,
			invoice_number: invoiceNumber,
			item_ean: itemEan,
		};
		for (const field of fieldsToUpdate) {
			if (field === "reset_point") {
				updateData[field] = booleanToSQLiteInteger(
					(updates as any)[field] ?? false,
				);
			} else {
				updateData[field] = (updates as any)[field];
			}
		}

		const result = statement.run(updateData);

		if (result.changes === 0) {
			throw new Error("Stock movement not found");
		}

		return { changes: result.changes };
	}

	async delete(
		invoicePrefix: string,
		invoiceNumber: string,
		itemEan: string,
	): Promise<{ changes: number }> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.delete);
		const result = statement.run(invoicePrefix, invoiceNumber, itemEan);

		if (result.changes === 0) {
			throw new Error("Stock movement not found");
		}

		return { changes: result.changes };
	}

	async deleteByInvoice(invoicePrefix: string, invoiceNumber: string): Promise<{ changes: number }> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.deleteByInvoice);
		const result = statement.run(invoicePrefix, invoiceNumber);

		return { changes: result.changes };
	}

	private buildUpdateQuery(tableName: string, fields: string[]): string {
		const allowedFields = new Set(["amount", "price_per_unit", "reset_point"]);

		const validFields = fields.filter((f) => allowedFields.has(f));
		if (validFields.length !== fields.length) {
			throw new Error("Invalid field names detected");
		}

		const setClause = validFields
			.map((field) => `${field} = @${field}`)
			.join(", ");

		return `
      UPDATE ${tableName}
      SET ${setClause}
      WHERE invoice_prefix = @invoice_prefix AND invoice_number = @invoice_number AND item_ean = @item_ean
    `;
	}

	async getByItem(itemEan: string): Promise<StockMovement[]> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.getByItem);
		const movements = statement.all(itemEan) as any[];
		return movements.map((m) => ({
			...m,
			reset_point: sqliteIntegerToBoolean(m.reset_point),
		}));
	}

	async getStockAmountByItem(itemEan: string): Promise<number> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.getStockAmountByItem);
		const result = statement.get(itemEan) as
			| { total_amount: number }
			| undefined;
		return result?.total_amount || 0;
	}

	async getAverageBuyPriceByItem(itemEan: string): Promise<number> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.getAverageBuyPriceByItem);
		const result = statement.get(itemEan) as { avg_price: number } | undefined;
		return result?.avg_price || 0;
	}

	async getLastBuyPriceByItem(itemEan: string): Promise<number> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.getLastBuyPriceByItem);
		const result = statement.get(itemEan) as { last_price: number } | undefined;
		return result?.last_price || 0;
	}

	async shouldSetResetPoint(
		itemEan: string,
		newAmount: string,
	): Promise<boolean> {
		const currentStock = await this.getStockAmountByItem(itemEan);
		const newAmountNum = parseFloat(newAmount);
		const resultingStock = currentStock + newAmountNum;

		// Return true if we're crossing from positive to zero or negative
		return currentStock > 0 && resultingStock <= 0;
	}
}
