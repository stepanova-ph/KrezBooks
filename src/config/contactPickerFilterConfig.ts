import { FilterConfig } from "../types/filter";

/**
 * Filter configuration for Contacts table
 */
export const contactPickerFilterConfig: FilterConfig = {
  filters: [
    {
      id: "search",
      type: "text-search",
      label: "Hledat",
      placeholder: "Název, město, telefon, email...",
      searchFields: [
        { field: "ico", match: (value: string, query: string) => value.startsWith(query)},
        { field: "company_name"},
        { field: "dic", match: (value: string, query: string) => value.startsWith(query)},
      ],
      columnId: null,
      width: 200,
    },
  ],
};

export const initialContactPickerFilterState = {
    search: "",
}

export const defaultVisibleColumnsPicker = [
  "ico",
  "modifier", 
  "company_name",
  "dic",
  "price_group"
];
