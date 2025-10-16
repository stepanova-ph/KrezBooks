import { useMemo } from "react";
import { FilterState } from "src/types/filter";
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
): T[] {
  return useMemo(() => {
    return data.filter((item) => {
      // Text search filter
      if (filters.search && filters.search.trim() !== "") {
        const searchTerm = filters.search.toLowerCase().trim();

        // Determine which fields to search based on the data structure
        // This is a generic approach - searches common string fields
        const searchableFields = Object.keys(item).filter(
          (key) => typeof item[key] === "string",
        );

        const matches = searchableFields.some((field) => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(searchTerm);
        });

        if (!matches) return false;
      }

      if (typeof filters.is_supplier === "boolean") {
        if (filters.is_supplier && !item.is_supplier) return false;
      }
      if (typeof filters.is_customer === "boolean") {
        if (filters.is_customer && !item.is_customer) return false;
      }

      if (filters.ico && shouldFilterByICO(filters.ico)) {
        const itemICO = String(item.ico || "");
        if (!itemICO.includes(filters.ico)) return false;
      }

      if (filters.dic && typeof filters.dic === "object") {
        const { prefix, value } = filters.dic;

        if (prefix && value && shouldFilterByDIC(prefix, value)) {
          const itemDIC = String(item.dic || "");

          if (prefix !== "vlastní") {
            const fullDIC = prefix + value;
            if (!itemDIC.includes(fullDIC)) return false;
          } else {
            if (!itemDIC.includes(value)) return false;
          }
        }
      }

      // Price group multiselect - empty = all, otherwise OR logic
      const priceGroupFilter = filters.price_group || [];
      if (priceGroupFilter.length > 0) {
        if (!priceGroupFilter.includes(String(item.price_group))) {
          return false;
        }
      }

      // VAT rate filter (multiselect)
      if (
        filters.vat_rate &&
        Array.isArray(filters.vat_rate) &&
        filters.vat_rate.length > 0
      ) {
        if (!filters.vat_rate.includes(item.vat_rate)) return false;
      }

      // Unit of measure filter (multiselect)
      if (
        filters.unit_of_measure &&
        Array.isArray(filters.unit_of_measure) &&
        filters.unit_of_measure.length > 0
      ) {
        if (!filters.unit_of_measure.includes(item.unit_of_measure))
          return false;
      }

      // Sales group filter
      const salesGroupFilter = filters.sales_group || [];
      if (salesGroupFilter.length > 0) {
        if (
          !item.sales_group ||
          !salesGroupFilter.includes(String(item.sales_group))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);
}
