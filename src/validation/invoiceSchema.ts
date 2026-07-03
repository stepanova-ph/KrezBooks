import { z } from "zod";
import { optionalString } from "./optionalString";
import { validationMessages } from "../config/validationMessages";

const requiresDateTax = (type: number) => [1, 2, 3, 4, 6].includes(type); // all except 5 (korekce)
const requiresInvoiceFields = (type: number) => type === 2 || type === 4; // na fakturu

export const invoiceSchema = z
	.object({
		number: z
			.string()
			.min(1, validationMessages.invoice.number.required)
			.max(50, validationMessages.invoice.number.maxLength),

		prefix: z
			.string()
			.min(1, validationMessages.invoice.prefix.required)
			.max(10, validationMessages.invoice.prefix.maxLength),

		type: z.preprocess(
			(v) => Number(v),
			z
				.number()
				.int()
				.min(1)
				.max(6)
				.refine(
					(n) => [1, 2, 3, 4, 5, 6].includes(n),
					validationMessages.invoice.type.invalid,
				),
		),

		date_issue: z
			.string()
			.min(1, validationMessages.invoice.dateIssue.required),

		payment_method: z.preprocess(
			(v) =>
				v === "" || v === null || v === undefined ? 1 : Number(v),
			z
				.number()
				.refine(
					(n) => n === 0 || n === 1 || n === 2,
					validationMessages.invoice.paymentMethod.invalid,
				),
		),

		note: optionalString.refine(
			(val) => !val || val.length <= 500,
			validationMessages.invoice.note.maxLength,
		),

		date_tax: optionalString,
		date_due: optionalString,
		variable_symbol: optionalString,
		order_number: optionalString,

		is_in_eur: z.preprocess(
			(v) => v === true || v === "true" || v === 1,
			z.boolean(),
		),

		discount: z.preprocess(
			(v) => (v === "" || v === null || v === undefined ? null : Number(v)),
			z
				.number()
				.int(validationMessages.invoice.discount.invalid)
				.min(1, validationMessages.invoice.discount.invalid)
				.max(100, validationMessages.invoice.discount.invalid)
				.nullable(),
		),

		ico: optionalString,
		modifier: z.preprocess(
			(v) =>
				v === "" || v === null || v === undefined ? undefined : Number(v),
			z.number().int().min(0).max(100).optional(),
		),
		dic: optionalString,
		company_name: optionalString,
		bank_account: optionalString,
		street: optionalString,
		city: optionalString,
		postal_code: optionalString,
		phone: optionalString,
		email: optionalString,
	})
	.superRefine((data, ctx) => {
		// date_tax required for types 1–4
		if (requiresDateTax(data.type)) {
			if (!data.date_tax) {
				ctx.addIssue({
					path: ["date_tax"],
					code: z.ZodIssueCode.custom,
					message: validationMessages.invoice.dateTax.required,
				});
			}
		}

		// date_due, ico, variable_symbol required for types 2 & 4 (modifier is optional)
		if (requiresInvoiceFields(data.type)) {
			if (!data.date_due) {
				ctx.addIssue({
					path: ["date_due"],
					code: z.ZodIssueCode.custom,
					message: validationMessages.invoice.dateDue.required,
				});
			}

			if (!data.variable_symbol) {
				ctx.addIssue({
					path: ["variable_symbol"],
					code: z.ZodIssueCode.custom,
					message: validationMessages.invoice.variableSymbol.required,
				});
			}

			if (data.payment_method === undefined) {
				ctx.addIssue({
					path: ["payment_method"],
					code: z.ZodIssueCode.custom,
					message: "Způsob úhrady je povinný",
				});
			}
		}
	});
