import { stockMovementQueries } from "../main/queries/stockMovements";
import { getDatabase } from "../main/database";
import { StockMovement, CreateStockMovementInput } from "../types/database";

export class StockMovementService {
	async getAll(): Promise<StockMovement[]> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.getAll);
		const movements = statement.all();
		return movements as StockMovement[];
	}

	async getOne(
		invoiceNumber: string,
		itemEan: string,
	): Promise<StockMovement | undefined> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.getOne);
		const movement = statement.get(invoiceNumber, itemEan);
		return movement as StockMovement | undefined;
	}

	async getByInvoice(invoiceNumber: string): Promise<StockMovement[]> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.getByInvoice);
		const movements = statement.all(invoiceNumber);
		return movements as StockMovement[];
	}

	async create(
		movement: CreateStockMovementInput,
	): Promise<{ changes: number }> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.create);

		const movementData = {
			invoice_number: movement.invoice_number,
			item_ean: movement.item_ean,
			amount: movement.amount,
			price_per_unit: movement.price_per_unit,
			vat_rate: movement.vat_rate,
		};

		const result = statement.run(movementData);

		return {
			changes: result.changes,
		};
	}

	async update(
		invoiceNumber: string,
		itemEan: string,
		updates: Partial<StockMovement>,
	): Promise<{ changes: number }> {
		const db = getDatabase();

		const fieldsToUpdate = Object.keys(updates).filter(
			(key) =>
				key !== "invoice_number" && key !== "item_ean" && key !== "created_at",
		);

		if (fieldsToUpdate.length === 0) {
			throw new Error("No fields to update");
		}

		const sql = this.buildUpdateQuery("stock_movements", fieldsToUpdate);
		const statement = db.prepare(sql);

		const updateData: any = {
			invoice_number: invoiceNumber,
			item_ean: itemEan,
		};
		for (const field of fieldsToUpdate) {
			updateData[field] = (updates as any)[field];
		}

		const result = statement.run(updateData);

		if (result.changes === 0) {
			throw new Error("Stock movement not found");
		}

		return { changes: result.changes };
	}

	async delete(
		invoiceNumber: string,
		itemEan: string,
	): Promise<{ changes: number }> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.delete);
		const result = statement.run(invoiceNumber, itemEan);

		if (result.changes === 0) {
			throw new Error("Stock movement not found");
		}

		return { changes: result.changes };
	}

	async deleteByInvoice(invoiceNumber: string): Promise<{ changes: number }> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.deleteByInvoice);
		const result = statement.run(invoiceNumber);

		return { changes: result.changes };
	}

	private buildUpdateQuery(tableName: string, fields: string[]): string {
		const allowedFields = new Set(["amount", "price_per_unit"]);

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
      WHERE invoice_number = @invoice_number AND item_ean = @item_ean
    `;
	}

	async getByItem(itemEan: string): Promise<StockMovement[]> {
		const db = getDatabase();
		const statement = db.prepare(stockMovementQueries.getByItem);
		const movements = statement.all(itemEan);
		return movements as StockMovement[];
	}

	async getStockAmountByItem(itemEan: string): Promise<number> {
	const db = getDatabase();
	const statement = db.prepare(stockMovementQueries.getStockAmountByItem);
	const result = statement.get(itemEan) as { total_amount: number } | undefined;
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
}