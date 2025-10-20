import { z } from "zod";
import { optionalString } from "./optionalString";
import { validationMessages } from "../config/validationMessages";

export const invoiceSchema = z
  .object({
    number: z
      .string()
      .min(1, validationMessages.invoice.number.required)
      .max(50, validationMessages.invoice.number.maxLength),

    type: z.preprocess(
      (v) => Number(v),
      z
        .number()
        .int()
        .min(1)
        .max(5)
        .refine((n) => [1, 2, 3, 4, 5].includes(n), validationMessages.invoice.type.invalid)
    ),

    payment_method: z.preprocess(
      (v) => Number(v),
      z.number().refine((n) => n === 0 || n === 1, validationMessages.invoice.paymentMethod.invalid)
    ),

    date_issue: z.string().min(1, validationMessages.invoice.dateIssue.required),

    date_tax: z.string().min(1, validationMessages.invoice.dateTax.required),

    date_due: z.string().min(1, validationMessages.invoice.dateDue.required),

    variable_symbol: z
      .string()
      .min(1, validationMessages.invoice.variableSymbol.required)
      .max(50, validationMessages.invoice.variableSymbol.maxLength),

    note: optionalString.refine(
      (val) => !val || val.length <= 500,
      validationMessages.invoice.note.maxLength
    ),

    // Contact fields - required for types 1-4, optional for type 5
    ico: optionalString,

    modifier: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
      z.number().int().min(1).max(100).optional()
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
    // For types 1-4 (purchases and sales), contact info is required
    if (data.type >= 1 && data.type <= 4) {
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

      if (!data.company_name || data.company_name.length < 2) {
        ctx.addIssue({
          path: ["company_name"],
          code: z.ZodIssueCode.custom,
          message: validationMessages.invoice.companyName.required,
        });
      }
    }

    // For type 5 (correction), contact info is optional - no validation needed
  });