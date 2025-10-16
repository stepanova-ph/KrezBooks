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

      // Unit of measure filter - text search
      if (filters.unit_of_measure && filters.unit_of_measure.trim() !== "") {
        const unitSearchTerm = filters.unit_of_measure.toLowerCase().trim();
        const itemUnit = String(item.unit_of_measure || "").toLowerCase();
        if (!itemUnit.includes(unitSearchTerm)) {
          return false;
        }
      }

      // Category filter - text search in category field
      if (filters.category && filters.category.trim() !== "") {
        const categorySearchTerm = filters.category.toLowerCase().trim();
        const itemCategory = String(item.category || "").toLowerCase();
        if (!itemCategory.includes(categorySearchTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);
}