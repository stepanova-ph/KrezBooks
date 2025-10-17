export const contactQueries = {
  getAll: `
    SELECT * FROM contacts 
    ORDER BY company_name
  `,
  
  getOne: `
    SELECT * FROM contacts 
    WHERE ico = ? AND modifier = ?
  `,
  
  create: `
    INSERT INTO contacts (
      ico, 
      modifier, 
      dic, 
      company_name, 
      representative_name,
      street, 
      city, 
      postal_code, 
      is_supplier, 
      is_customer,
      price_group, 
      phone, 
      email, 
      website, 
      bank_account
    ) VALUES (
      @ico, 
      @modifier, 
      @dic, 
      @company_name, 
      @representative_name,
      @street, 
      @city, 
      @postal_code, 
      @is_supplier, 
      @is_customer,
      @price_group, 
      @phone, 
      @email, 
      @website, 
      @bank_account
    )
  `,
  
  delete: `
    DELETE FROM contacts 
    WHERE ico = ? AND modifier = ?
  `,
};