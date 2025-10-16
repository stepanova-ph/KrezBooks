import { validationMessages } from "../config/validationMessages";
import { z } from "zod";
import { UNIT_OPTIONS } from "../config/constants";

export const itemSchema = z.object({
  ean: z
    .string()
    .min(1, validationMessages.item.eanRequired || "EAN je povinný")
    .max(50, validationMessages.item.eanMaxLength || "EAN je příliš dlouhý"),
  
  name: z
    .string()
    .min(1, validationMessages.item.nameRequired)
    .max(200, validationMessages.item.nameMaxLength),
  
  category: z
    .string()
    .max(100, validationMessages.item.categoryMaxLength || "Kategorie je příliš dlouhá")
    .optional(),
  
  note: z
    .string()
    .max(500, validationMessages.item.noteMaxLength)
    .optional(),
  
  vat_rate: z.preprocess(
    (v) => Number(v),
    z.number().refine((n) => !isNaN(n), {
      message: validationMessages.item.vatRate,
    }),
  ),
  
  avg_purchase_price: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .min(0, validationMessages.item.priceMin)
      .default(0),
  ),
  
  last_purchase_price: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .min(0, validationMessages.item.priceMin)
      .default(0),
  ),
  
  unit_of_measure: z.enum(UNIT_OPTIONS, { error: validationMessages.item.unitInvalid }),
  
  sale_price_group1: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .min(0, validationMessages.item.priceMin)
      .default(0),
  ),
  
  sale_price_group2: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .min(0, validationMessages.item.priceMin)
      .default(0),
  ),
  
  sale_price_group3: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .min(0, validationMessages.item.priceMin)
      .default(0),
  ),
  
  sale_price_group4: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .min(0, validationMessages.item.priceMin)
      .default(0),
  ),
});