export const validationMessages = {
  ico: {
    length: 'IČO musí mít 8 číslic.',
    invalid: 'IČO není platné (kontrolní součet nesouhlasí).',
  },
  dic: {
    invalid: "DIČ musí začínat 'CZ' a obsahovat 8–10 číslic.",
  },
  modifier: {
    range: 'Modifikátor musí být mezi 1 a 100.',
  },
  companyName: {
    required: 'Název firmy je povinný.',
  },
  representativeName: {
    minLength: 'Jméno zástupce musí mít alespoň 4 znaky.',
    invalid: 'Jméno zástupce neplatné.',
    maxLength: 'Jméno zástupce je příliš dlouhé.',
  },
  street: {
    minLength: 'Ulice musí mít alespoň 3 znaky.',
  },
  city: {
    minLength: 'Město musí mít alespoň 2 znaky.',
    invalid: 'Město nemá správný tvar.',
  },
  postalCode: {
    invalid: 'PSČ musí mít tvar 12345 nebo 123 45.',
  },
  phone: {
    invalid: 'Telefon musí být platné české číslo.',
  },
  email: {
    invalid: 'E-mail nemá platný formát.',
  },
  website: {
    invalid: 'Webová adresa nemá platný formát (použijte např. www.example.cz nebo https://www.example.cz).',
  },
  bankAccount: {
    invalid: 'Číslo účtu nemá platný formát.',
  },
  priceGroup: {
    range: 'Cenová skupina musí být mezi 1 a 4.',
  },
  contactType: {
    required: 'Musíte vybrat alespoň Odběratele nebo Dodavatele.',
  },
  item: {
    // ✨ added these three keys:
    eanRequired: 'EAN je povinný.',
    eanMaxLength: 'EAN je příliš dlouhý.',
    categoryMaxLength: 'Kategorie je příliš dlouhá.',

    nameRequired: 'Název položky je povinný.',
    nameMaxLength: 'Maximální délka názvu je 200 znaků.',
    salesGroup: 'Vyberte skupinu.',
    noteMaxLength: 'Maximální délka poznámky je 500 znaků.',
    vatRate: 'Zadejte platnou sazbu DPH.',
    priceMin: 'Cena musí být číslo větší nebo rovno nule.',
    unitInvalid: 'Neplatná volba: vyberte jednu z "ks", "kg", nebo "l".',
  },
};
