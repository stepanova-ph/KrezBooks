import { z } from "zod";

export const unitOptions = ["ks", "kg", "l"] as const;

export const itemSchema = z.object({
  name: z
    .string()
    .min(1, "Název položky je povinný.")
    .max(200, "Maximální délka názvu je 200 znaků."),
  sales_group: z.enum(["1", "2", "3", "4"], { error: "Vyberte skupinu." }),
  note: z
    .string()
    .max(500, "Maximální délka poznámky je 500 znaků.")
    .optional(),
  vat_rate: z.preprocess(
    (v) => Number(v),
    z.number().refine((n) => !isNaN(n), {
      message: "Zadejte platnou sazbu DPH.",
    }),
  ),
  avg_purchase_price: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .min(0, "Průměrná nákupní cena musí být číslo větší nebo rovno nule.")
      .default(0),
  ),
  last_purchase_price: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .min(0, "Poslední nákupní cena musí být číslo větší nebo rovno nule.")
      .default(0),
  ),
  unit_of_measure: z.enum(unitOptions, {
    error: 'Neplatná volba: vyberte jednu z "ks", "kg", nebo "l".',
  }),
  sale_price_group1: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .min(0, "Prodejní cena musí být číslo větší nebo rovno nule.")
      .default(0),
  ),
  sale_price_group2: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .min(0, "Prodejní cena musí být číslo větší nebo rovno nule.")
      .default(0),
  ),
  sale_price_group3: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .min(0, "Prodejní cena musí být číslo větší nebo rovno nule.")
      .default(0),
  ),
  sale_price_group4: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .min(0, "Prodejní cena musí být číslo větší nebo rovno nule.")
      .default(0),
  ),
});
