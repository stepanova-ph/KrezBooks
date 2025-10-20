import { z } from "zod";
import { validationMessages } from "../config/validationMessages";

export const stockMovementSchema = z.object({
  invoice_number: z
    .string()
    .min(1, validationMessages.stockMovement.invoiceNumberRequired)
    .max(50, validationMessages.stockMovement.invoiceNumberMaxLength),
  
  item_ean: z
    .string()
    .min(1, validationMessages.stockMovement.eanRequired)
    .max(50, validationMessages.stockMovement.eanMaxLength),
  
  amount: z
    .string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, validationMessages.stockMovement.amountRequired),
  
  price_per_unit: z
    .string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, "Cena musí být kladné číslo"),
});