import { FilterConfig, ItemFilterState } from "../types/filter";

/**
 * Filter configuration for Items table
 */
export const itemFilterConfig: FilterConfig = {
  filters: [
    // Global text search
    {
      id: "search",
      type: "text-search",
      label: "Hledat",
      placeholder: "Název, poznámka...",
      searchFields: ["name", "note"],
      columnId: null, // Always visible
    },

    // VAT rate multi-select
    {
      id: "vat_rate",
      type: "multiselect",
      label: "Sazba DPH",
      field: "vat_rate",
      columnId: "vat_rate",
      placeholder: "Všechny sazby",
      options: [
        { value: 0, label: "0% (nulová sazba)" },
        { value: 1, label: "21% (základní sazba)" },
        { value: 2, label: "12% (snížená sazba)" },
      ],
    },

    // Unit of measure multi-select
    {
      id: "unit_of_measure",
      type: "multiselect",
      label: "Měrná jednotka",
      field: "unit_of_measure",
      columnId: "unit_of_measure",
      placeholder: "Všechny jednotky",
      options: [
        { value: "ks", label: "ks (kusy)" },
        { value: "kg", label: "kg (kilogramy)" },
        { value: "l", label: "l (litry)" },
        { value: "m", label: "m (metry)" },
        { value: "m2", label: "m² (metry čtvereční)" },
        { value: "m3", label: "m³ (metry krychlové)" },
        { value: "t", label: "t (tuny)" },
        { value: "hod", label: "hod (hodiny)" },
      ],
    },

    // Sales group text input
    {
      id: "sales_group",
      type: "multiselect",
      label: "Prodejní skupina",
      field: "sales_group",
      columnId: "sales_group",
      placeholder: "Všechny skupiny",
      options: [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
      ],
    },
  ],
};

/**
 * Initial/default filter state for items
 */
export const initialItemFilterState: ItemFilterState = {
  search: "",
  vat_rate: [],
  unit_of_measure: [],
  sales_group: "",
};

export const defaultVisibleColumnsItem = [
  "id",
  "name",
  "sales_group",
  "unit",
  "vat",
  "sale_price_group1",
  "sale_price_group2",
];
