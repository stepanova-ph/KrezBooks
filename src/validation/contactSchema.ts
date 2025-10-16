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
import { z } from "zod";

// At the top of your schema file, add this helper
const optionalString = z.preprocess(
  (val) => (val === "" || val === null ? undefined : val),
  z.string().optional(),
);

// Then use it like this:
export const contactSchema = z
  .object({
    ico: z
      .string()
      .min(8, "IČO musí mít 8 číslic.")
      .max(8, "IČO musí mít 8 číslic.")
      .refine(
        (val) => validateICO(val),
        "IČO není platné (kontrolní součet nesouhlasí).",
      ),

    dic: optionalString.refine(
      (val) => validateDIC(val!, ""),
      "DIČ musí začínat kódem země a obsahovat 8–10 číslic.",
    ),

    modifier: z.preprocess(
      (v) => Number(v),
      z
        .number()
        .int()
        .min(1, "Modifikátor musí být mezi 1 a 100.")
        .max(100, "Modifikátor musí být mezi 1 a 100."),
    ),

    company_name: z.string().min(1, "Název firmy je povinný."),

    representative_name: optionalString
      .refine(
        (val) => !val || val.length >= 4,
        "Jméno zástupce musí mít alespoň 4 znaky.",
      )
      .refine(
        (val) => !val || /^[\p{L}\s\-']*$/u.test(val),
        "Jméno zástupce neplatné.",
      )
      .refine(
        (val) => !val || val.length <= 150,
        "Jméno zástupce je příliš dlouhé.",
      ),

    street: optionalString.refine(
      (val) => !val || val.length >= 3,
      "Ulice musí mít alespoň 3 znaky.",
    ),

    city: optionalString
      .refine(
        (val) => !val || val.length >= 2,
        "Město musí mít alespoň 2 znaky.",
      )
      .refine(
        (val) => !val || /^[\p{L}\s\-]*$/u.test(val),
        "Město nemá správný tvar.",
      ),

    postal_code: optionalString
      .refine(
        (val) => !val || validatePSC(val),
        "PSČ musí mít tvar 12345 nebo 123 45.",
      )
      .transform((val) => (val ? normalizePSC(val) : val)),

    phone: optionalString.refine(
      (val) => !val || validatePhone(val),
      "Telefon musí být platné české číslo.",
    ),

    email: optionalString.refine(
      (val) => !val || validateEmail(val),
      "E-mail nemá platný formát.",
    ),

    website: optionalString
      .refine(
        (val) => !val || validateWebsite(val),
        "Webová adresa nemá platný formát (použijte např. www.example.cz nebo https://www.example.cz).",
      )
      .transform((val) => (val ? normalizeWebsite(val) : val)),

    bank_account: optionalString.refine(
      (val) => !val || validateBankAccount(val),
      "Číslo účtu nemá platný formát.",
    ),

    is_supplier: z.boolean(),
    is_customer: z.boolean(),

    price_group: z.preprocess(
      (v) => Number(v),
      z
        .number()
        .int()
        .min(1, "Cenová skupina musí být mezi 1 a 4.")
        .max(4, "Cenová skupina musí být mezi 1 a 4."),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.dic && data.dic !== "CZ" && !validateDIC(data.dic, data.ico)) {
      ctx.addIssue({
        path: ["dic"],
        code: z.ZodIssueCode.custom,
        message: "DIČ musí začínat 'CZ' a obsahovat 8–10 číslic.",
      });
    }
    if (!data.is_customer && !data.is_supplier) {
      ctx.addIssue({
        path: ["is_customer"],
        code: z.ZodIssueCode.custom,
        message: "Musíte vybrat alespoň Odběratele nebo Dodavatele.",
      });
      ctx.addIssue({
        path: ["is_supplier"],
        code: z.ZodIssueCode.custom,
        message: "Musíte vybrat alespoň Odběratele nebo Dodavatele.",
      });
    }
  });
