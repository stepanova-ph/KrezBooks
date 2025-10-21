import { getDatabase } from "../main/database";
import { invoiceQueries } from "../main/queries";
import { Invoice, CreateInvoiceInput } from "../types/database";

export class InvoiceService {
  async getAll(): Promise<Invoice[]> {
    const db = getDatabase();
    const statement = db.prepare(invoiceQueries.getAll);
    const invoices = statement.all();
    return invoices as Invoice[];
  }

  async getOne(number: string): Promise<Invoice | undefined> {
    const db = getDatabase();
    const statement = db.prepare(invoiceQueries.getOne);
    const invoice = statement.get(number);
    return invoice as Invoice | undefined;
  }

  async create(invoice: CreateInvoiceInput): Promise<{ changes: number }> {
    const db = getDatabase();
    const statement = db.prepare(invoiceQueries.create);

    const invoiceData = {
      number: invoice.number,
      type: invoice.type,
      payment_method: invoice.payment_method ?? null,
      date_issue: invoice.date_issue,
      date_tax: invoice.date_tax || null,
      date_due: invoice.date_due || null,
      variable_symbol: invoice.variable_symbol || null,
      note: invoice.note || null,
      ico: invoice.ico || null,
      modifier: invoice.modifier ?? null,
      dic: invoice.dic || null,
      company_name: invoice.company_name || null,
      bank_account: invoice.bank_account || null,
      street: invoice.street || null,
      city: invoice.city || null,
      postal_code: invoice.postal_code || null,
      phone: invoice.phone || null,
      email: invoice.email || null,
    };

    const result = statement.run(invoiceData);
    return { changes: result.changes };
  }

  async update(number: string, updates: Partial<Invoice>): Promise<{ changes: number }> {
    const db = getDatabase();

    const fieldsToUpdate = Object.keys(updates).filter(
      (key) => key !== "number" && key !== "created_at" && key !== "updated_at"
    );

    if (fieldsToUpdate.length === 0) {
      throw new Error("No fields to update");
    }

    const sql = this.buildUpdateQuery("invoices", fieldsToUpdate);
    const statement = db.prepare(sql);

    const updateData: any = { number };
    for (const field of fieldsToUpdate) {
      updateData[field] = (updates as any)[field] ?? null;
    }

    const result = statement.run(updateData);
    return { changes: result.changes };
  }

  async delete(number: string): Promise<{ changes: number }> {
    const db = getDatabase();
    const statement = db.prepare(invoiceQueries.delete);
    const result = statement.run(number);
    return { changes: result.changes };
  }

  private buildUpdateQuery(tableName: string, fields: string[]): string {
    const allowedFields = new Set([
      "type",
      "payment_method",
      "date_issue",
      "date_tax",
      "date_due",
      "variable_symbol",
      "note",
      "ico",
      "modifier",
      "dic",
      "company_name",
      "bank_account",
      "street",
      "city",
      "postal_code",
      "phone",
      "email",
    ]);

    const validFields = fields.filter((f) => allowedFields.has(f));
    if (validFields.length !== fields.length) {
      throw new Error("Invalid field names detected");
    }

    const setClause = validFields.map((field) => `${field} = @${field}`).join(", ");

    return `
      UPDATE ${tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE number = @number
    `;
  }
}