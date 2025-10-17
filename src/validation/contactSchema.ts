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
import { optionalString } from "./optionalString";

export const contactSchema = z
  .object({
    ico: z
      .string()
      // .min(8, validationMessages.contact.ico.length)
      // .max(8, validationMessages.contact.ico.length)
      // .refine(
      //   (val) => validateICO(val),
      //   validationMessages.contact.ico.invalid,
      // )
      ,

    dic: optionalString
    // .refine(
      // (val) => validateDIC(val!, ""),
      // validationMessages.contact.dic.invalid,
    // )
    ,

    modifier: z.preprocess(
      (v) => Number(v),
      z
      .number()
      .int()
      .min(1, validationMessages.contact.modifier.range)
      .max(100, validationMessages.contact.modifier.range),
    ),

    company_name: z
                  .string()
                  .min(2, validationMessages.contact.companyName.required)
                  .max(40, validationMessages.contact.companyName.maxLength),

    representative_name: optionalString
      .refine(
        (val) => !val || val.length >= 4,
        validationMessages.contact.representativeName.minLength,
      )
      .refine(
        (val) => !val || /^[\p{L}\s\-']*$/u.test(val),
        validationMessages.contact.representativeName.invalid,
      )
      .refine(
        (val) => !val || val.length <= 150,
        validationMessages.contact.representativeName.maxLength,
      ),

    street: optionalString.refine(
      (val) => !val || val.length >= 3,
      validationMessages.contact.street.minLength,
    ),

    city: optionalString
      .refine(
        (val) => !val || val.length >= 2,
        validationMessages.contact.city.minLength,
      )
      .refine(
        (val) => !val || /^[\p{L}\s\-]*$/u.test(val),
        validationMessages.contact.city.invalid,
      ),

    postal_code: optionalString
      .refine(
        (val) => !val || validatePSC(val),
        validationMessages.contact.postalCode.invalid,
      )
      .transform((val) => (val ? normalizePSC(val) : val)),

    phone: optionalString.refine(
      (val) => !val || validatePhone(val),
      validationMessages.contact.phone.invalid,
    ),

    email: optionalString.refine(
      (val) => !val || validateEmail(val),
      validationMessages.contact.email.invalid,
    ),

    website: optionalString
      .refine(
        (val) => !val || validateWebsite(val),
        validationMessages.contact.website.invalid,
      )
      .transform((val) => (val ? normalizeWebsite(val) : val)),

    bank_account: optionalString.refine(
      (val) => !val || validateBankAccount(val),
      validationMessages.contact.bankAccount.invalid,
    ),

    is_supplier: z.boolean(),
    is_customer: z.boolean(),

    price_group: z.preprocess(
      (v) => Number(v),
      z
        .number()
        .int()
        .min(1, validationMessages.contact.priceGroup.range)
        .max(4, validationMessages.contact.priceGroup.range),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.dic && data.dic !== "CZ" && !validateDIC(data.dic, data.ico)) {
      ctx.addIssue({
        path: ["dic"],
        code: z.ZodIssueCode.custom,
        message: validationMessages.contact.dic.invalid,
      });
    }
    if (!data.is_customer && !data.is_supplier) {
      ctx.addIssue({
        path: ["is_customer"],
        code: z.ZodIssueCode.custom,
        message: validationMessages.contact.contactType.required,
      });
      ctx.addIssue({
        path: ["is_supplier"],
        code: z.ZodIssueCode.custom,
        message: validationMessages.contact.contactType.required,
      });
    }
  });