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
      placeholder: "IČO, DIČ, název...",
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

export const initialPickerFilterState = {
    search: "",
}

export const defaultVisibleColumnsContactPicker = [
  "ico",
  "modifier", 
  "company_name",
  "dic",
  "price_group"
];

export const itemPickerFilterConfig: FilterConfig = {
  filters: [
    {
      id: "search",
      type: "text-search",
      label: "Hledat",
      placeholder: "IČO, DIČ, název...",
      searchFields: [
        { field: "ean", match: (value: string, query: string) => value.startsWith(query)},
        { field: "name"},
        { field: "dic", match: (value: string, query: string) => value.startsWith(query)},
      ],
      columnId: null,
      width: 200,
    },
  ],
};
