export const itemQueries = {
  getAll: `
    SELECT * FROM items 
    ORDER BY name
  `,
  
  getOne: `
    SELECT * FROM items 
    WHERE ean = ?
  `,
  
  create: `
    INSERT INTO items (
      ean,
      category, 
      name, 
      note, 
      vat_rate, 
      avg_purchase_price,
      last_purchase_price, 
      unit_of_measure, 
      sale_price_group1,
      sale_price_group2, 
      sale_price_group3, 
      sale_price_group4
    ) VALUES (
      @ean,
      @category, 
      @name, 
      @note, 
      @vat_rate, 
      @avg_purchase_price,
      @last_purchase_price, 
      @unit_of_measure, 
      @sale_price_group1,
      @sale_price_group2, 
      @sale_price_group3, 
      @sale_price_group4
    )
  `,
  
  delete: `
    DELETE FROM items 
    WHERE ean = ?
  `,
};