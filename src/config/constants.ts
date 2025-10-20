export const VAT_RATES = [
  { percentage: 0, label: '0% (osvobozeno)' },
  { percentage: 12, label: '12% (snížená)' },
  { percentage: 21, label: '21% (základní)' },] as const;

export const PRICE_GROUPS = [0, 1, 2, 3, 4] as const;

export const UNIT_OPTIONS = ["ks", "kg", "l", "m", "m2", "m3"] as const;

export const CONTACT_TYPES = {
  supplier: { label: 'Dodavatel' },
  customer: { label: 'Odběratel' },
}

export const INVOICE_TYPES = [
  { value: 0, label: "Nákup (hotovost)" },
  { value: 1, label: "Nákup (faktura)" },
  { value: 2, label: "Prodej (hotovost)" },
  { value: 3, label: "Prodej (faktura)" },
  { value: 4, label: "Korekce skladu" },
 ] as const;



