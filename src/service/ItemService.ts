import { itemQueries } from "../main/queries";
import { Item, CreateItemInput } from "../types/database";
import { BaseService } from "./BaseService";

const ALLOWED_UPDATE_FIELDS = new Set([
	"category",
	"name",
	"note",
	"vat_rate",
	"unit_of_measure",
	"sale_price_group1",
	"sale_price_group2",
	"sale_price_group3",
	"sale_price_group4",
]);

export class ItemService extends BaseService {
	async getAll(): Promise<Item[]> {
		const db = this.getDb();
		const statement = db.prepare(itemQueries.getAll);
		const items = statement.all();
		return items as Item[];
	}

	async getOne(ean: string): Promise<Item | undefined> {
		const db = this.getDb();
		const statement = db.prepare(itemQueries.getOne);
		const item = statement.get(ean);
		return item as Item | undefined;
	}

	async create(item: CreateItemInput): Promise<{ changes: number }> {
		const db = this.getDb();
		const statement = db.prepare(itemQueries.create);

		const itemData = {
			ean: item.ean,
			category: item.category || null,
			name: item.name,
			note: item.note || null,
			vat_rate: item.vat_rate,
			unit_of_measure: item.unit_of_measure,
			sale_price_group1: item.sale_price_group1,
			sale_price_group2: item.sale_price_group2,
			sale_price_group3: item.sale_price_group3,
			sale_price_group4: item.sale_price_group4,
		};

		const result = statement.run(itemData);

		return {
			changes: result.changes,
		};
	}

	async update(
		ean: string,
		updates: Partial<Item>,
	): Promise<{ changes: number }> {
		const db = this.getDb();

		const fieldsToUpdate = this.getFieldsToUpdate(updates, ["ean"]);

		const sql = this.buildUpdateQuery(
			"items",
			fieldsToUpdate,
			ALLOWED_UPDATE_FIELDS,
			"ean = @ean"
		);
		const statement = db.prepare(sql);

		const updateData: Record<string, unknown> = { ean };
		for (const field of fieldsToUpdate) {
			updateData[field] = (updates as Record<string, unknown>)[field] ?? null;
		}

		const result = statement.run(updateData);

		if (result.changes === 0) {
			throw new Error("Položka nenalezena");
		}

		return { changes: result.changes };
	}

	async delete(ean: string): Promise<{ changes: number }> {
		const db = this.getDb();
		const statement = db.prepare(itemQueries.delete);
		const result = statement.run(ean);

		if (result.changes === 0) {
			throw new Error("Položka nenalezena");
		}

		return { changes: result.changes };
	}

	async getCategories(): Promise<string[]> {
		const db = this.getDb();
		const statement = db.prepare(itemQueries.getCategories);
		const results = statement.all() as { category: string }[];
		return results.map((r) => r.category);
	}
}
