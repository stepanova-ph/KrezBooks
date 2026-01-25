import {
	deserializeContact,
	serializeContact,
} from "../utils/typeConverterUtils";
import { contactQueries } from "../main/queries";
import { Contact, CreateContactInput } from "../types/database";
import { BaseService } from "./BaseService";

const ALLOWED_UPDATE_FIELDS = new Set([
	"dic",
	"company_name",
	"representative_name",
	"street",
	"city",
	"postal_code",
	"is_supplier",
	"is_customer",
	"price_group",
	"phone",
	"email",
	"website",
	"bank_account",
]);

export class ContactService extends BaseService {
	async getAll(): Promise<Contact[]> {
		const db = this.getDb();
		const statement = db.prepare(contactQueries.getAll);
		const contacts = statement.all();
		return contacts.map((c) => deserializeContact(c));
	}

	async getOne(ico: string, modifier: number): Promise<Contact | undefined> {
		const db = this.getDb();
		const statement = db.prepare(contactQueries.getOne);
		const contact = statement.get(ico, modifier);
		return contact ? deserializeContact(contact) : undefined;
	}

	async create(contact: CreateContactInput): Promise<{ changes: number }> {
		const db = this.getDb();
		const statement = db.prepare(contactQueries.create);
		const serialized = serializeContact(contact);
		const result = statement.run(serialized);
		return { changes: result.changes };
	}

	async update(
		ico: string,
		modifier: number,
		updates: Partial<Contact>,
	): Promise<{ changes: number }> {
		const db = this.getDb();

		const fieldsToUpdate = this.getFieldsToUpdate(updates, ["ico", "modifier"]);

		const sql = this.buildUpdateQuery(
			"contacts",
			fieldsToUpdate,
			ALLOWED_UPDATE_FIELDS,
			"ico = @ico AND modifier = @modifier"
		);
		const statement = db.prepare(sql);

		const serialized = serializeContact({ ...updates, ico, modifier });
		const result = statement.run(serialized);

		if (result.changes === 0) {
			throw new Error("Kontakt nenalezen");
		}

		return { changes: result.changes };
	}

	async delete(ico: string, modifier: number): Promise<{ changes: number }> {
		const db = this.getDb();
		const statement = db.prepare(contactQueries.delete);
		const result = statement.run(ico, modifier);

		if (result.changes === 0) {
			throw new Error("Kontakt nenalezen");
		}

		return { changes: result.changes };
	}
}
