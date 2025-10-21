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

    // Unit of measure text search
    {
      id: "unit_of_measure",
      type: "text-search",
      label: "Měrná jednotka",
      field: "unit_of_measure",
      columnId: "unit_of_measure",
      placeholder: "Hledat jednotku...",
      searchFields: ["unit_of_measure"],
    },

    // Category text search
 {
      id: "category",
      type: "multiselect", // Changed from text-search
      field: "category",
      label: "Kategorie",
      columnId: "category",
      placeholder: "Všechny kategorie",
      options: [], // Empty by default, will be populated dynamically
    },
  ],
};

/**
 * Initial/default filter state for items
 */
export const initialItemFilterState: ItemFilterState = {
  search: "",
  vat_rate: [],
  unit_of_measure: "",
  category: [],
};

export const defaultVisibleColumnsItem = [
  "ean",
  "name",
  "category",
  "unit",
  "vat",
  "sale_price_group1",
  "sale_price_group2",
];