import { stockMovementQueries } from "../main/queries/stockMovements";
import {
	StockMovement,
	CreateStockMovementInput,
	StockMovementWithInvoiceInfo,
} from "../types/database";
import {
	booleanToSQLiteInteger,
	sqliteIntegerToBoolean,
} from "../utils/typeConverterUtils";
import { BaseService } from "./BaseService";

const ALLOWED_UPDATE_FIELDS = new Set(["amount", "price_per_unit", "reset_point"]);

export class StockMovementService extends BaseService {
	async getAll(): Promise<StockMovement[]> {
		const db = this.getDb();
		const statement = db.prepare(stockMovementQueries.getAll);
		const movements = statement.all() as Record<string, unknown>[];
		return movements.map((m) => ({
			...m,
			reset_point: sqliteIntegerToBoolean(m.reset_point as number),
		})) as StockMovement[];
	}

	async getOne(
		invoicePrefix: string,
		invoiceNumber: string,
		itemEan: string,
	): Promise<StockMovement | undefined> {
		const db = this.getDb();
		const statement = db.prepare(stockMovementQueries.getOne);
		const movement = statement.get(
			invoicePrefix,
			invoiceNumber,
			itemEan,
		) as Record<string, unknown> | undefined;
		if (!movement) return undefined;
		return {
			...movement,
			reset_point: sqliteIntegerToBoolean(movement.reset_point as number),
		} as StockMovement;
	}

	async getByInvoice(
		invoicePrefix: string,
		invoiceNumber: string,
	): Promise<StockMovement[]> {
		const db = this.getDb();
		const statement = db.prepare(stockMovementQueries.getByInvoice);
		const movements = statement.all(invoicePrefix, invoiceNumber) as Record<string, unknown>[];
		return movements.map((m) => ({
			...m,
			reset_point: sqliteIntegerToBoolean(m.reset_point as number),
		})) as StockMovement[];
	}

	async create(
		movement: CreateStockMovementInput,
	): Promise<{ changes: number }> {
		const db = this.getDb();
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
		const db = this.getDb();

		const fieldsToUpdate = this.getFieldsToUpdate(updates, [
			"invoice_prefix",
			"invoice_number",
			"item_ean",
		]);

		const sql = this.buildUpdateQuery(
			"stock_movements",
			fieldsToUpdate,
			ALLOWED_UPDATE_FIELDS,
			"invoice_prefix = @invoice_prefix AND invoice_number = @invoice_number AND item_ean = @item_ean",
			false
		);
		const statement = db.prepare(sql);

		const updateData: Record<string, unknown> = {
			invoice_prefix: invoicePrefix,
			invoice_number: invoiceNumber,
			item_ean: itemEan,
		};
		for (const field of fieldsToUpdate) {
			if (field === "reset_point") {
				updateData[field] = booleanToSQLiteInteger(
					(updates as Record<string, unknown>)[field] as boolean ?? false,
				);
			} else {
				updateData[field] = (updates as Record<string, unknown>)[field];
			}
		}

		const result = statement.run(updateData);

		if (result.changes === 0) {
			throw new Error("Skladový pohyb nenalezen");
		}

		return { changes: result.changes };
	}

	async delete(
		invoicePrefix: string,
		invoiceNumber: string,
		itemEan: string,
	): Promise<{ changes: number }> {
		const db = this.getDb();
		const statement = db.prepare(stockMovementQueries.delete);
		const result = statement.run(invoicePrefix, invoiceNumber, itemEan);

		if (result.changes === 0) {
			throw new Error("Skladový pohyb nenalezen");
		}

		return { changes: result.changes };
	}

	async deleteByInvoice(
		invoicePrefix: string,
		invoiceNumber: string,
	): Promise<{ changes: number }> {
		const db = this.getDb();
		const statement = db.prepare(stockMovementQueries.deleteByInvoice);
		const result = statement.run(invoicePrefix, invoiceNumber);

		return { changes: result.changes };
	}

	async getByItem(itemEan: string): Promise<StockMovement[]> {
		const db = this.getDb();
		const statement = db.prepare(stockMovementQueries.getByItem);
		const movements = statement.all(itemEan) as Record<string, unknown>[];
		return movements.map((m) => ({
			...m,
			reset_point: sqliteIntegerToBoolean(m.reset_point as number),
		})) as StockMovement[];
	}

	async getStockAmountByItem(itemEan: string): Promise<number> {
		const db = this.getDb();
		const statement = db.prepare(stockMovementQueries.getStockAmountByItem);
		const result = statement.get(itemEan) as
			| { total_amount: number }
			| undefined;
		return result?.total_amount || 0;
	}

	async getAverageBuyPriceByItem(itemEan: string): Promise<number> {
		const db = this.getDb();
		const statement = db.prepare(stockMovementQueries.getAverageBuyPriceByItem);
		const result = statement.get(itemEan, itemEan) as
			| { avg_price: number }
			| undefined;
		return result?.avg_price || 0;
	}

	async getLastBuyPriceByItem(itemEan: string): Promise<number> {
		const db = this.getDb();
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

	async shouldSetResetPointBatch(
		items: { itemEan: string; newAmount: string }[],
	): Promise<Record<string, boolean>> {
		const result: Record<string, boolean> = {};
		for (const { itemEan, newAmount } of items) {
			result[itemEan] = await this.shouldSetResetPoint(itemEan, newAmount);
		}
		return result;
	}

	async getByItemWithInvoiceInfo(
		itemEan: string,
	): Promise<StockMovementWithInvoiceInfo[]> {
		const db = this.getDb();
		const statement = db.prepare(stockMovementQueries.getByItemWithInvoiceInfo);
		const movements = statement.all(itemEan) as Record<string, unknown>[];
		return movements.map((m) => ({
			...m,
			reset_point: sqliteIntegerToBoolean(m.reset_point as number),
		})) as StockMovementWithInvoiceInfo[];
	}
}
