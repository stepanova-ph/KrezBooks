import {
  normalizePSC,
  normalizeWebsite,
  validateBankAccount,
  validateDIC,
  validateEmail,
  validateICO,
  validatePhone,
  validatePSC,
  validateWebsite,
} from "../utils/validationUtils";
import { validationMessages } from "../config/validationMessages";
import { z } from "zod";

// Helper for optional string fields
const optionalString = z.preprocess(
  (val) => (val === "" || val === null ? undefined : val),
  z.string().optional(),
);

export const contactSchema = z
  .object({
    ico: z
      .string()
      .min(8, validationMessages.ico.length)
      .max(8, validationMessages.ico.length)
      .refine(
        (val) => validateICO(val),
        validationMessages.ico.invalid,
      ),

    dic: optionalString.refine(
      (val) => validateDIC(val!, ""),
      validationMessages.dic.invalid,
    ),

    modifier: z.preprocess(
      (v) => Number(v),
      z
        .number()
        .int()
        .min(1, validationMessages.modifier.range)
        .max(100, validationMessages.modifier.range),
    ),

    company_name: z.string().min(1, validationMessages.companyName.required),

    representative_name: optionalString
      .refine(
        (val) => !val || val.length >= 4,
        validationMessages.representativeName.minLength,
      )
      .refine(
        (val) => !val || /^[\p{L}\s\-']*$/u.test(val),
        validationMessages.representativeName.invalid,
      )
      .refine(
        (val) => !val || val.length <= 150,
        validationMessages.representativeName.maxLength,
      ),

    street: optionalString.refine(
      (val) => !val || val.length >= 3,
      validationMessages.street.minLength,
    ),

    city: optionalString
      .refine(
        (val) => !val || val.length >= 2,
        validationMessages.city.minLength,
      )
      .refine(
        (val) => !val || /^[\p{L}\s\-]*$/u.test(val),
        validationMessages.city.invalid,
      ),

    postal_code: optionalString
      .refine(
        (val) => !val || validatePSC(val),
        validationMessages.postalCode.invalid,
      )
      .transform((val) => (val ? normalizePSC(val) : val)),

    phone: optionalString.refine(
      (val) => !val || validatePhone(val),
      validationMessages.phone.invalid,
    ),

    email: optionalString.refine(
      (val) => !val || validateEmail(val),
      validationMessages.email.invalid,
    ),

    website: optionalString
      .refine(
        (val) => !val || validateWebsite(val),
        validationMessages.website.invalid,
      )
      .transform((val) => (val ? normalizeWebsite(val) : val)),

    bank_account: optionalString.refine(
      (val) => !val || validateBankAccount(val),
      validationMessages.bankAccount.invalid,
    ),

    is_supplier: z.boolean(),
    is_customer: z.boolean(),

    price_group: z.preprocess(
      (v) => Number(v),
      z
        .number()
        .int()
        .min(1, validationMessages.priceGroup.range)
        .max(4, validationMessages.priceGroup.range),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.dic && data.dic !== "CZ" && !validateDIC(data.dic, data.ico)) {
      ctx.addIssue({
        path: ["dic"],
        code: z.ZodIssueCode.custom,
        message: validationMessages.dic.invalid,
      });
    }
    if (!data.is_customer && !data.is_supplier) {
      ctx.addIssue({
        path: ["is_customer"],
        code: z.ZodIssueCode.custom,
        message: validationMessages.contactType.required,
      });
      ctx.addIssue({
        path: ["is_supplier"],
        code: z.ZodIssueCode.custom,
        message: validationMessages.contactType.required,
      });
    }
  });