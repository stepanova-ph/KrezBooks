import type { CreateContactInput, CreateItemInput, VatRate } from '../types/database';

const czechCities = ['Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'České Budějovice', 'Hradec Králové'];
const companyTypes = ['s.r.o.', 'a.s.', 'v.o.s.'];
const companyNames = [
  'TechnoStav',
  'AutoServis Plus',
  'Elektro Centrum',
  'Stavební Firma',
  'IT Solutions',
  'Zahradnictví',
  'Pekárna',
  'Kavárna',
  'Knihkupectví',
  'Nábytek Design'
];

const itemNames = [
  'Notebook Dell', 'Klávesnice Logitech', 'Myš bezdrátová', 'Monitor 24"',
  'Tiskárna HP', 'Kancelářská židle', 'Stůl pracovní', 'Lampa LED',
  'Papír A4', 'Toner černý', 'USB flash disk', 'Sluchátka',
  'Webkamera HD', 'Tablet Samsung', 'Router WiFi', 'Kabel HDMI'
];

const units = ['ks', 'bal', 'm', 'kg', 'l'];

export function generateRandomContact(): CreateContactInput {
  const randomIco = Math.floor(10000000 + Math.random() * 90000000).toString();
  const companyBase = companyNames[Math.floor(Math.random() * companyNames.length)];
  const companyType = companyTypes[Math.floor(Math.random() * companyTypes.length)];
  const city = czechCities[Math.floor(Math.random() * czechCities.length)];
  
  return {
    ico: randomIco,
    modifier: 1,
    dic: `CZ${randomIco}`,
    company_name: `${companyBase} ${companyType}`,
    representative_name: generateRandomName(),
    street: `${generateStreetName()} ${Math.floor(Math.random() * 100) + 1}`,
    city: city,
    postal_code: generatePostalCode(),
    phone: generatePhone(),
    email: `${companyBase.toLowerCase().replace(/\s/g, '')}@example.cz`,
    website: `www.${companyBase.toLowerCase().replace(/\s/g, '')}.cz`,
    bank_account: generateBankAccount(),
    is_supplier: Math.random() > 0.5,
    is_customer: Math.random() > 0.3,
    price_group: (Math.floor(Math.random() * 4) + 1) as 1 | 2 | 3 | 4,
  };
}

export function generateRandomItem(): CreateItemInput {
  const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];
  const basePurchasePrice = Math.floor(Math.random() * 50000) + 5000; // 50-550 Kč
  const markup = 1.3 + Math.random() * 0.5; // 30-80% markup
  
  return {
    name: itemName,
    sales_group: Math.ceil(Math.random() * 4).toString(),
    note: Math.random() > 0.5 ? `Testovací položka - ${itemName}` : '',
  vat_rate: Math.floor(Math.random() * 3) as VatRate,
    avg_purchase_price: basePurchasePrice,
    last_purchase_price: basePurchasePrice + Math.floor(Math.random() * 2000 - 1000),
    unit_of_measure: units[Math.floor(Math.random() * units.length)],
    sale_price_group1: Math.floor(basePurchasePrice * markup),
    sale_price_group2: Math.floor(basePurchasePrice * markup * 0.95),
    sale_price_group3: Math.floor(basePurchasePrice * markup * 0.90),
    sale_price_group4: Math.floor(basePurchasePrice * markup * 0.85),
  };
}

function generateRandomName(): string {
  const firstNames = ['Jan', 'Petr', 'Pavel', 'Josef', 'Tomáš', 'Martin', 'Jiří', 'Jaroslav', 'Eva', 'Marie'];
  const lastNames = ['Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function generateStreetName(): string {
  const streets = ['Hlavní', 'Nádražní', 'Školní', 'Zahradní', 'Polní', 'Lesní', 'Pobřežní', 'Jiráskova'];
  return streets[Math.floor(Math.random() * streets.length)];
}

function generatePostalCode(): string {
  return `${Math.floor(100 + Math.random() * 700)} ${Math.floor(10 + Math.random() * 90)}`;
}

function generatePhone(): string {
  return `+420 ${Math.floor(600 + Math.random() * 200)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`;
}

function generateBankAccount(): string {
  return `${Math.floor(1000000 + Math.random() * 9000000)}/${Math.floor(1000 + Math.random() * 9000)}`;
}