import { getDatabase } from "../main/database";
import Database from "better-sqlite3";

/**
 * Base service class providing common database operations.
 * Subclasses should define their allowed update fields and primary key structure.
 */
export abstract class BaseService {
	/**
	 * Get the database instance
	 */
	protected getDb(): Database.Database {
		return getDatabase();
	}

	/**
	 * Build a dynamic UPDATE query with field validation.
	 *
	 * @param tableName - Name of the table to update
	 * @param fields - Fields to update (will be validated against allowedFields)
	 * @param allowedFields - Set of field names that are allowed to be updated
	 * @param whereClause - WHERE clause for the update (e.g., "ean = @ean")
	 * @param includeUpdatedAt - Whether to include updated_at = CURRENT_TIMESTAMP
	 * @returns SQL UPDATE query string
	 */
	protected buildUpdateQuery(
		tableName: string,
		fields: string[],
		allowedFields: Set<string>,
		whereClause: string,
		includeUpdatedAt: boolean = true
	): string {
		const validFields = fields.filter((f) => allowedFields.has(f));
		if (validFields.length !== fields.length) {
			throw new Error("Neplatné názvy polí");
		}

		const setClause = validFields
			.map((field) => `${field} = @${field}`)
			.join(", ");

		const updatedAtClause = includeUpdatedAt ? ", updated_at = CURRENT_TIMESTAMP" : "";

		return `
			UPDATE ${tableName}
			SET ${setClause}${updatedAtClause}
			WHERE ${whereClause}
		`;
	}

	/**
	 * Validate that there are fields to update, excluding primary keys and timestamps.
	 *
	 * @param updates - Object containing the updates
	 * @param excludeFields - Fields to exclude from the update (e.g., primary keys)
	 * @returns Array of field names to update
	 * @throws Error if no fields to update
	 */
	protected getFieldsToUpdate(
		updates: Record<string, unknown>,
		excludeFields: string[]
	): string[] {
		const excludeSet = new Set([...excludeFields, "created_at", "updated_at"]);
		const fieldsToUpdate = Object.keys(updates).filter(
			(key) => !excludeSet.has(key)
		);

		if (fieldsToUpdate.length === 0) {
			throw new Error("Žádná pole k aktualizaci");
		}

		return fieldsToUpdate;
	}
}
