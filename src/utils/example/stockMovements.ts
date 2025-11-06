/**
 * Example stock movements dataset (deterministic, seed 0)
 * Includes all invoices (0001–0050)
 */

import { StockMovement } from "src/types/database";
import { exampleItems } from "./items";

export const exampleStockMovements: Array<StockMovement> = [
  // ─────────────────────────────
  // TYPE 5 – Initial stock corrections
  // ─────────────────────────────
  {
    invoice_number: "0001",
    item_ean: exampleItems[0].ean, // Ponorné čerpadlo 0.5 HP
    amount: 20,
    price_per_unit: exampleItems[0].sale_price_group1,
    vat_rate: exampleItems[0].vat_rate,
  },
  {
    invoice_number: "0001",
    item_ean: exampleItems[1].ean,
    amount: 15,
    price_per_unit: exampleItems[1].sale_price_group1,
    vat_rate: exampleItems[1].vat_rate,
  },
  {
    invoice_number: "0002",
    item_ean: exampleItems[5].ean, // Kalová čerpadla
    amount: 25,
    price_per_unit: exampleItems[5].sale_price_group1,
    vat_rate: exampleItems[5].vat_rate,
  },
  {
    invoice_number: "0003",
    item_ean: exampleItems[10].ean, // Zahradní čerpadla
    amount: 30,
    price_per_unit: exampleItems[10].sale_price_group1,
    vat_rate: exampleItems[10].vat_rate,
  },
  {
    invoice_number: "0004",
    item_ean: exampleItems[15].ean, // Tlaková čerpadla
    amount: 25,
    price_per_unit: exampleItems[15].sale_price_group1,
    vat_rate: exampleItems[15].vat_rate,
  },
  {
    invoice_number: "0005",
    item_ean: exampleItems[20].ean, // Cirkulační čerpadla
    amount: 20,
    price_per_unit: exampleItems[20].sale_price_group1,
    vat_rate: exampleItems[20].vat_rate,
  },
  {
    invoice_number: "0006",
    item_ean: exampleItems[25].ean, // Hadice
    amount: 100,
    price_per_unit: exampleItems[25].sale_price_group1,
    vat_rate: exampleItems[25].vat_rate,
  },
  {
    invoice_number: "0007",
    item_ean: exampleItems[32].ean, // Spínače
    amount: 50,
    price_per_unit: exampleItems[32].sale_price_group1,
    vat_rate: exampleItems[32].vat_rate,
  },
  {
    invoice_number: "0008",
    item_ean: exampleItems[36].ean, // Nádoby
    amount: 30,
    price_per_unit: exampleItems[36].sale_price_group1,
    vat_rate: exampleItems[36].vat_rate,
  },
  {
    invoice_number: "0009",
    item_ean: exampleItems[39].ean, // Měřidla
    amount: 40,
    price_per_unit: exampleItems[39].sale_price_group1,
    vat_rate: exampleItems[39].vat_rate,
  },

  // ─────────────────────────────
  // TYPE 1 – Buy Cash Invoices
  // ─────────────────────────────
  {
    invoice_number: "0011",
    item_ean: exampleItems[0].ean,
    amount: 5,
    price_per_unit: exampleItems[0].sale_price_group1,
    vat_rate: exampleItems[0].vat_rate,
  },
  {
    invoice_number: "0011",
    item_ean: exampleItems[2].ean,
    amount: 3,
    price_per_unit: exampleItems[2].sale_price_group1,
    vat_rate: exampleItems[2].vat_rate,
  },
  {
    invoice_number: "0012",
    item_ean: exampleItems[6].ean,
    amount: 4,
    price_per_unit: exampleItems[6].sale_price_group1,
    vat_rate: exampleItems[6].vat_rate,
  },
  {
    invoice_number: "0012",
    item_ean: exampleItems[8].ean,
    amount: 2,
    price_per_unit: exampleItems[8].sale_price_group1,
    vat_rate: exampleItems[8].vat_rate,
  },
  {
    invoice_number: "0013",
    item_ean: exampleItems[26].ean,
    amount: 30,
    price_per_unit: exampleItems[26].sale_price_group1,
    vat_rate: exampleItems[26].vat_rate,
  },
  {
    invoice_number: "0013",
    item_ean: exampleItems[28].ean,
    amount: 25,
    price_per_unit: exampleItems[28].sale_price_group1,
    vat_rate: exampleItems[28].vat_rate,
  },
  {
    invoice_number: "0014",
    item_ean: exampleItems[11].ean,
    amount: 10,
    price_per_unit: exampleItems[11].sale_price_group1,
    vat_rate: exampleItems[11].vat_rate,
  },
  {
    invoice_number: "0014",
    item_ean: exampleItems[12].ean,
    amount: 8,
    price_per_unit: exampleItems[12].sale_price_group1,
    vat_rate: exampleItems[12].vat_rate,
  },
  {
    invoice_number: "0015",
    item_ean: exampleItems[22].ean,
    amount: 4,
    price_per_unit: exampleItems[22].sale_price_group1,
    vat_rate: exampleItems[22].vat_rate,
  },
  {
    invoice_number: "0015",
    item_ean: exampleItems[23].ean,
    amount: 6,
    price_per_unit: exampleItems[23].sale_price_group1,
    vat_rate: exampleItems[23].vat_rate,
  },

  // ─────────────────────────────
  // TYPE 2 – Buy Invoices (Bank)
  // ─────────────────────────────
  {
    invoice_number: "0021",
    item_ean: exampleItems[13].ean,
    amount: 12,
    price_per_unit: exampleItems[13].sale_price_group2,
    vat_rate: exampleItems[13].vat_rate,
  },
  {
    invoice_number: "0021",
    item_ean: exampleItems[15].ean,
    amount: 6,
    price_per_unit: exampleItems[15].sale_price_group2,
    vat_rate: exampleItems[15].vat_rate,
  },
  {
    invoice_number: "0022",
    item_ean: exampleItems[9].ean,
    amount: 8,
    price_per_unit: exampleItems[9].sale_price_group2,
    vat_rate: exampleItems[9].vat_rate,
  },
  {
    invoice_number: "0022",
    item_ean: exampleItems[10].ean,
    amount: 10,
    price_per_unit: exampleItems[10].sale_price_group2,
    vat_rate: exampleItems[10].vat_rate,
  },
  {
    invoice_number: "0023",
    item_ean: exampleItems[4].ean,
    amount: 4,
    price_per_unit: exampleItems[4].sale_price_group2,
    vat_rate: exampleItems[4].vat_rate,
  },
  {
    invoice_number: "0023",
    item_ean: exampleItems[7].ean,
    amount: 6,
    price_per_unit: exampleItems[7].sale_price_group2,
    vat_rate: exampleItems[7].vat_rate,
  },
  {
    invoice_number: "0024",
    item_ean: exampleItems[16].ean,
    amount: 5,
    price_per_unit: exampleItems[16].sale_price_group2,
    vat_rate: exampleItems[16].vat_rate,
  },
  {
    invoice_number: "0024",
    item_ean: exampleItems[17].ean,
    amount: 5,
    price_per_unit: exampleItems[17].sale_price_group2,
    vat_rate: exampleItems[17].vat_rate,
  },
  // ─────────────────────────────
// TYPE 3 – Sell Cash Invoices
// ─────────────────────────────
{
  invoice_number: "0031",
  item_ean: exampleItems[0].ean,
  amount: 2,
  price_per_unit: exampleItems[0].sale_price_group2,
  vat_rate: exampleItems[0].vat_rate,
},
{
  invoice_number: "0031",
  item_ean: exampleItems[1].ean,
  amount: 3,
  price_per_unit: exampleItems[1].sale_price_group2,
  vat_rate: exampleItems[1].vat_rate,
},
{
  invoice_number: "0032",
  item_ean: exampleItems[5].ean,
  amount: 4,
  price_per_unit: exampleItems[5].sale_price_group3,
  vat_rate: exampleItems[5].vat_rate,
},
{
  invoice_number: "0032",
  item_ean: exampleItems[6].ean,
  amount: 2,
  price_per_unit: exampleItems[6].sale_price_group3,
  vat_rate: exampleItems[6].vat_rate,
},
{
  invoice_number: "0033",
  item_ean: exampleItems[10].ean,
  amount: 2,
  price_per_unit: exampleItems[10].sale_price_group3,
  vat_rate: exampleItems[10].vat_rate,
},
{
  invoice_number: "0033",
  item_ean: exampleItems[12].ean,
  amount: 1,
  price_per_unit: exampleItems[12].sale_price_group3,
  vat_rate: exampleItems[12].vat_rate,
},
{
  invoice_number: "0034",
  item_ean: exampleItems[22].ean,
  amount: 5,
  price_per_unit: exampleItems[22].sale_price_group3,
  vat_rate: exampleItems[22].vat_rate,
},
{
  invoice_number: "0034",
  item_ean: exampleItems[23].ean,
  amount: 2,
  price_per_unit: exampleItems[23].sale_price_group3,
  vat_rate: exampleItems[23].vat_rate,
},
{
  invoice_number: "0035",
  item_ean: exampleItems[26].ean,
  amount: 10,
  price_per_unit: exampleItems[26].sale_price_group3,
  vat_rate: exampleItems[26].vat_rate,
},
{
  invoice_number: "0035",
  item_ean: exampleItems[27].ean,
  amount: 8,
  price_per_unit: exampleItems[27].sale_price_group3,
  vat_rate: exampleItems[27].vat_rate,
},
{
  invoice_number: "0036",
  item_ean: exampleItems[29].ean,
  amount: 3,
  price_per_unit: exampleItems[29].sale_price_group3,
  vat_rate: exampleItems[29].vat_rate,
},
{
  invoice_number: "0036",
  item_ean: exampleItems[30].ean,
  amount: 2,
  price_per_unit: exampleItems[30].sale_price_group3,
  vat_rate: exampleItems[30].vat_rate,
},
{
  invoice_number: "0037",
  item_ean: exampleItems[32].ean,
  amount: 5,
  price_per_unit: exampleItems[32].sale_price_group3,
  vat_rate: exampleItems[32].vat_rate,
},
{
  invoice_number: "0037",
  item_ean: exampleItems[34].ean,
  amount: 2,
  price_per_unit: exampleItems[34].sale_price_group3,
  vat_rate: exampleItems[34].vat_rate,
},
{
  invoice_number: "0038",
  item_ean: exampleItems[36].ean,
  amount: 3,
  price_per_unit: exampleItems[36].sale_price_group3,
  vat_rate: exampleItems[36].vat_rate,
},
{
  invoice_number: "0038",
  item_ean: exampleItems[37].ean,
  amount: 1,
  price_per_unit: exampleItems[37].sale_price_group3,
  vat_rate: exampleItems[37].vat_rate,
},
{
  invoice_number: "0039",
  item_ean: exampleItems[39].ean,
  amount: 4,
  price_per_unit: exampleItems[39].sale_price_group3,
  vat_rate: exampleItems[39].vat_rate,
},
{
  invoice_number: "0039",
  item_ean: exampleItems[40].ean,
  amount: 3,
  price_per_unit: exampleItems[40].sale_price_group3,
  vat_rate: exampleItems[40].vat_rate,
},
{
  invoice_number: "0040",
  item_ean: exampleItems[15].ean,
  amount: 2,
  price_per_unit: exampleItems[15].sale_price_group2,
  vat_rate: exampleItems[15].vat_rate,
},
{
  invoice_number: "0040",
  item_ean: exampleItems[16].ean,
  amount: 1,
  price_per_unit: exampleItems[16].sale_price_group2,
  vat_rate: exampleItems[16].vat_rate,
},

// ─────────────────────────────
// TYPE 4 – Sell Invoice (Bank)
// ─────────────────────────────
{
  invoice_number: "0041",
  item_ean: exampleItems[0].ean,
  amount: 2,
  price_per_unit: exampleItems[0].sale_price_group2,
  vat_rate: exampleItems[0].vat_rate,
},
{
  invoice_number: "0041",
  item_ean: exampleItems[3].ean,
  amount: 1,
  price_per_unit: exampleItems[3].sale_price_group2,
  vat_rate: exampleItems[3].vat_rate,
},
{
  invoice_number: "0042",
  item_ean: exampleItems[8].ean,
  amount: 3,
  price_per_unit: exampleItems[8].sale_price_group2,
  vat_rate: exampleItems[8].vat_rate,
},
{
  invoice_number: "0042",
  item_ean: exampleItems[9].ean,
  amount: 2,
  price_per_unit: exampleItems[9].sale_price_group2,
  vat_rate: exampleItems[9].vat_rate,
},
{
  invoice_number: "0043",
  item_ean: exampleItems[13].ean,
  amount: 1,
  price_per_unit: exampleItems[13].sale_price_group2,
  vat_rate: exampleItems[13].vat_rate,
},
{
  invoice_number: "0043",
  item_ean: exampleItems[14].ean,
  amount: 1,
  price_per_unit: exampleItems[14].sale_price_group2,
  vat_rate: exampleItems[14].vat_rate,
},
{
  invoice_number: "0044",
  item_ean: exampleItems[17].ean,
  amount: 2,
  price_per_unit: exampleItems[17].sale_price_group2,
  vat_rate: exampleItems[17].vat_rate,
},
{
  invoice_number: "0044",
  item_ean: exampleItems[18].ean,
  amount: 1,
  price_per_unit: exampleItems[18].sale_price_group2,
  vat_rate: exampleItems[18].vat_rate,
},
{
  invoice_number: "0045",
  item_ean: exampleItems[20].ean,
  amount: 2,
  price_per_unit: exampleItems[20].sale_price_group2,
  vat_rate: exampleItems[20].vat_rate,
},
{
  invoice_number: "0045",
  item_ean: exampleItems[21].ean,
  amount: 2,
  price_per_unit: exampleItems[21].sale_price_group2,
  vat_rate: exampleItems[21].vat_rate,
},
{
  invoice_number: "0046",
  item_ean: exampleItems[25].ean,
  amount: 8,
  price_per_unit: exampleItems[25].sale_price_group2,
  vat_rate: exampleItems[25].vat_rate,
},
{
  invoice_number: "0046",
  item_ean: exampleItems[28].ean,
  amount: 6,
  price_per_unit: exampleItems[28].sale_price_group2,
  vat_rate: exampleItems[28].vat_rate,
},
{
  invoice_number: "0047",
  item_ean: exampleItems[31].ean,
  amount: 4,
  price_per_unit: exampleItems[31].sale_price_group2,
  vat_rate: exampleItems[31].vat_rate,
},
{
  invoice_number: "0047",
  item_ean: exampleItems[32].ean,
  amount: 3,
  price_per_unit: exampleItems[32].sale_price_group2,
  vat_rate: exampleItems[32].vat_rate,
},
{
  invoice_number: "0048",
  item_ean: exampleItems[36].ean,
  amount: 2,
  price_per_unit: exampleItems[36].sale_price_group2,
  vat_rate: exampleItems[36].vat_rate,
},
{
  invoice_number: "0048",
  item_ean: exampleItems[38].ean,
  amount: 1,
  price_per_unit: exampleItems[38].sale_price_group2,
  vat_rate: exampleItems[38].vat_rate,
},
{
  invoice_number: "0049",
  item_ean: exampleItems[40].ean,
  amount: 3,
  price_per_unit: exampleItems[40].sale_price_group2,
  vat_rate: exampleItems[40].vat_rate,
},
{
  invoice_number: "0049",
  item_ean: exampleItems[40].ean,
  amount: 2,
  price_per_unit: exampleItems[40].sale_price_group2,
  vat_rate: exampleItems[40].vat_rate,
},
{
  invoice_number: "0050",
  item_ean: exampleItems[27].ean,
  amount: 5,
  price_per_unit: exampleItems[27].sale_price_group2,
  vat_rate: exampleItems[27].vat_rate,
},
{
  invoice_number: "0050",
  item_ean: exampleItems[29].ean,
  amount: 3,
  price_per_unit: exampleItems[29].sale_price_group2,
  vat_rate: exampleItems[29].vat_rate,
},
];
