export const VAT_RATES = {
  0: { percentage: 0, label: '0% (osvobozeno)' },
  1: { percentage: 12, label: '12% (snížená)' },
  2: { percentage: 21, label: '21% (základní)' },
} as const;

export const PRICE_GROUPS = [1, 2, 3, 4] as const;

export const UNIT_OPTIONS = ['ks', 'kg', 'l'] as const;

export const CONTACT_TYPE = {
  supplier: 'Dodavatel',
  customer: 'Odběratel',
}