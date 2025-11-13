import { z } from "zod";
import { optionalString } from "./optionalString";
import { validationMessages } from "../config/validationMessages";

// Helpers
const requiresDateTax = (type: number) => [1, 2, 3, 4].includes(type); // all except 5 (korekce)
const requiresInvoiceFields = (type: number) => type === 2 || type === 4; // na fakturu

export const invoiceSchema = z
	.object({
		number: z
			.string()
			.min(1, validationMessages.invoice.number.required)
			.max(50, validationMessages.invoice.number.maxLength),

		prefix: optionalString.refine(
			(val) => !val || val.length <= 10,
			"Prefix může mít maximálně 10 znaků",
		),

		type: z.preprocess(
			(v) => Number(v),
			z
				.number()
				.int()
				.min(1)
				.max(5)
				.refine(
					(n) => [1, 2, 3, 4, 5].includes(n),
					validationMessages.invoice.type.invalid,
				),
		),

		date_issue: z
			.string()
			.min(1, validationMessages.invoice.dateIssue.required),

		payment_method: z.preprocess(
			(v) =>
				v === "" || v === null || v === undefined ? undefined : Number(v),
			z
				.number()
				.refine(
					(n) => n === 0 || n === 1,
					validationMessages.invoice.paymentMethod.invalid,
				)
				.optional(),
		),

		note: optionalString.refine(
			(val) => !val || val.length <= 500,
			validationMessages.invoice.note.maxLength,
		),

		// Optional fields; requirements enforced in superRefine
		date_tax: optionalString,
		date_due: optionalString,
		variable_symbol: optionalString,

		ico: optionalString,
		modifier: z.preprocess(
			(v) =>
				v === "" || v === null || v === undefined ? undefined : Number(v),
			z.number().int().min(1).max(100).optional(),
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

		// date_due, ico, modifier, variable_symbol required for types 2 & 4
		if (requiresInvoiceFields(data.type)) {
			if (!data.date_due) {
				ctx.addIssue({
					path: ["date_due"],
					code: z.ZodIssueCode.custom,
					message: validationMessages.invoice.dateDue.required,
				});
			}

			if (!data.ico || data.ico.length !== 8) {
				ctx.addIssue({
					path: ["ico"],
					code: z.ZodIssueCode.custom,
					message: validationMessages.invoice.ico.required,
				});
			}

			if (data.modifier === undefined || data.modifier === null) {
				ctx.addIssue({
					path: ["modifier"],
					code: z.ZodIssueCode.custom,
					message: validationMessages.invoice.modifier.required,
				});
			}

			if (!data.variable_symbol) {
				ctx.addIssue({
					path: ["variable_symbol"],
					code: z.ZodIssueCode.custom,
					message: validationMessages.invoice.variableSymbol.required,
				});
			}
		}
	});
