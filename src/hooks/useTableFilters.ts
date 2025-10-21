import { useMemo } from "react";
import { FilterConfig, FilterState, TextSearchFilterDef } from "src/types/filter";
import {
  shouldFilterByDIC,
  shouldFilterByICO,
} from "../validation/filterValitation";

/**
 * Hook to filter table data based on filter state
 *
 * @param data - Array of data items to filter
 * @param filters - Current filter state
 * @returns Filtered array
 */
export function useTableFilters<T extends Record<string, any>>(
  data: T[],
  filters: FilterState,
  config: FilterConfig
): T[] {
  return useMemo(() => {
    return data.filter((item) => {
      if (filters.search && filters.search.trim() !== "") {
        const searchTerm = filters.search.toLowerCase().trim();

        const searchableFieldsWithMatchFunctions = config.filters
          .filter((filter): filter is TextSearchFilterDef => filter.type === "text-search")
          .flatMap(filter =>
            filter.searchFields.map(({ field, match }) => ({ field, match }))
          );


        const matches = searchableFieldsWithMatchFunctions.some(({ field, match }) => {
        const value = item[field];
        console.log(`Value for ${field}:`, value);

        if (match) {
          try {
            return match(value, searchTerm);
          } catch (err) {
            console.warn(`Match function for field "${field}" threw an error:`, err);
            return false;
          }
        } else if (typeof value === "string") {
          return value.toLowerCase().includes(searchTerm);
        }

        return (
          value != null &&
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });


        if (!matches) return false;
      }

      if (typeof filters.is_supplier === "boolean") {
        if (filters.is_supplier && !item.is_supplier) return false;
      }
      if (typeof filters.is_customer === "boolean") {
        if (filters.is_customer && !item.is_customer) return false;
      }

      if (filters.ico) {
        const itemICO = String(item.ico || "");
        if (!itemICO.startsWith(filters.ico)) return false;
      }

      if (filters.dic && typeof filters.dic === "object") {
        const { prefix, value } = filters.dic;

        if (prefix && value) {
          const itemDIC = String(item.dic || "");

          if (prefix !== "vlastní") {
            const fullDIC = prefix + value;
            if (!itemDIC.includes(fullDIC)) return false;
          } else {
            if (!itemDIC.includes(value)) return false;
          }
        }
      }

      const priceGroupFilter = filters.price_group || [];
      if (priceGroupFilter.length > 0) {
        if (!priceGroupFilter.includes(item.price_group)) return false;
      }

      const vatRateFilter = filters.vat_rate || [];
      if (vatRateFilter.length > 0) {
        if (!vatRateFilter.includes(item.vat_rate)) return false;
      }

      if (filters.unit_of_measure && filters.unit_of_measure.trim() !== "") {
        const searchTerm = filters.unit_of_measure.toLowerCase().trim();
        const unitValue = String(item.unit_of_measure || "").toLowerCase();
        if (!unitValue.includes(searchTerm)) return false;
      }
        
      if (filters.category && Array.isArray(filters.category) && filters.category.length > 0) {
        const categoryValue = String(item.category || "");
        if (!filters.category.includes(categoryValue)) return false;
      }

      return true;
    });
  }, [data, filters]);
}