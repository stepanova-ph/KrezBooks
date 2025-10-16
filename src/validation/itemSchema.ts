import { validationMessages } from "../config/validationMessages";
import { z } from "zod";

export const unitOptions = ["ks", "kg", "l"] as const;

export const itemSchema = z.object({
  name: z
    .string()
    .min(1, validationMessages.item.nameRequired)
    .max(200, validationMessages.item.nameMaxLength),
  
  sales_group: z.enum(["1", "2", "3", "4"], { 
    errorMap: () => ({ message: validationMessages.item.salesGroup })
  }),
  
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
  
  unit_of_measure: z.enum(unitOptions, {
    errorMap: () => ({ message: validationMessages.item.unitInvalid })
  }),
  
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