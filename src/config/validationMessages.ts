export const validationMessages = {
  contact: {
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
      minLength: 'Název firmy musí mít alespoň 2 znaky.',
      maxLength: 'Název firmy je příliš dlouhý.',
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
  },
  item: {
    eanRequired: 'EAN je povinný.',
    eanMaxLength: 'EAN je příliš dlouhý (max. 50 znaků).',
    
    nameRequired: 'Název položky je povinný.',
    nameMaxLength: 'Maximální délka názvu je 200 znaků.',
    
    categoryMaxLength: 'Kategorie je příliš dlouhá (max. 100 znaků).',
    
    unitRequired: 'Měrná jednotka je povinná.',
    unitMaxLength: 'Měrná jednotka je příliš dlouhá (max. 20 znaků).',
    
    noteMaxLength: 'Maximální délka poznámky je 500 znaků.',
    
    vatRate: 'Zadejte platnou sazbu DPH.',
    priceMin: 'Cena musí být číslo větší nebo rovno nule.',
  },
  stockMovement: {
    invoiceNumberRequired: 'Číslo faktury je povinné.',
    invoiceNumberMaxLength: 'Číslo faktury je příliš dlouhé.',
    
    eanRequired: 'EAN položky je povinný.',
    eanMaxLength: 'EAN položky je příliš dlouhý.',
    
    amountRequired: 'Množství je povinné.',
    
    pricePerUnitRequired: 'Cena je povinná.',
    pricePerUnitInvalid: 'Cena musí bít kladné číslo.',
  },

// Add this to the existing validationMessages object:

  invoice: {
    number: {
      required: "Číslo faktury je povinné",
      maxLength: "Číslo faktury je příliš dlouhé (max 50 znaků)",
    },
    type: {
      invalid: "Typ faktury musí být mezi 1-5",
    },
    paymentMethod: {
      invalid: "Způsob platby musí být 0 nebo 1",
    },
    dateIssue: {
      required: "Datum vystavení je povinné",
    },
    dateTax: {
      required: "Datum zdanitelného plnění je povinné",
    },
    dateDue: {
      required: "Datum splatnosti je povinné",
    },
    variableSymbol: {
      required: "Variabilní symbol je povinný",
      maxLength: "Variabilní symbol je příliš dlouhý (max 50 znaků)",
    },
    note: {
      maxLength: "Poznámka je příliš dlouhá (max 500 znaků)",
    },
    ico: {
      required: "IČO je povinné pro tento typ faktury",
      length: "IČO musí mít 8 znaků",
    },
    modifier: {
      required: "Modifikátor je povinný pro tento typ faktury",
      range: "Modifikátor musí být mezi 1-100",
    },
    companyName: {
      required: "Název firmy je povinný pro tento typ faktury",
      minLength: "Název firmy musí mít alespoň 2 znaky",
      maxLength: "Název firmy je příliš dlouhý (max 40 znaků)",
    },
    contactRequired: "Údaje o kontaktu jsou povinné pro nákup a prodej",
  },
};