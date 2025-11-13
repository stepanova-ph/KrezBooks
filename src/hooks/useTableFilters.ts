import { useMemo } from "react";
import {
	FilterConfig,
	FilterState,
	TextSearchFilterDef,
} from "src/types/filter";

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
	config: FilterConfig,
): T[] {
	return useMemo(() => {
		return data.filter((item) => {
			if (filters.search && filters.search.trim() !== "") {
				const searchTerm = filters.search.toLowerCase().trim();

				const searchableFieldsWithMatchFunctions = config.filters
					.filter(
						(filter): filter is TextSearchFilterDef =>
							filter.type === "text-search",
					)
					.flatMap((filter) =>
						filter.searchFields.map(({ field, match }) => ({ field, match })),
					);

				const matches = searchableFieldsWithMatchFunctions.some(
					({ field, match }) => {
						const value = item[field];

						if (!value) return false;
						if (match) {
							try {
								return match(value, searchTerm);
							} catch (err) {
								console.warn(
									`Match function for field "${field}" threw an error:`,
									err,
								);
								return false;
							}
						} else if (typeof value === "string") {
							return value.toLowerCase().includes(searchTerm);
						}

						return (
							value != null &&
							String(value).toLowerCase().includes(searchTerm.toLowerCase())
						);
					},
				);

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

			if (
				filters.category &&
				Array.isArray(filters.category) &&
				filters.category.length > 0
			) {
				const categoryValue = String(item.category || "");
				if (!filters.category.includes(categoryValue)) return false;
			}

			if (filters.stock_amount && filters.stock_amount.value.trim() !== "") {
				const filterValue = parseFloat(filters.stock_amount.value);
				const itemValue = parseFloat(item.stock_amount) || 0;

				switch (filters.stock_amount.comparator) {
					case '>':
						if (!(itemValue > filterValue)) return false;
						break;
					case '=':
						if (itemValue !== filterValue) return false;
						break;
					case '<':
						if (!(itemValue < filterValue)) return false;
						break;
				}
			}

			// Invoice: Total amount filter with VAT checkbox
			if (filters.total_amount && filters.total_amount.value.trim() !== "") {
				const filterValue = parseFloat(filters.total_amount.value);
				const useVat = filters.total_amount_with_vat === true;
				const itemValue = useVat
					? parseFloat(item.total_with_vat) || 0
					: parseFloat(item.total_without_vat) || 0;

				switch (filters.total_amount.comparator) {
					case '>':
						if (!(itemValue > filterValue)) return false;
						break;
					case '=':
						if (itemValue !== filterValue) return false;
						break;
					case '<':
						if (!(itemValue < filterValue)) return false;
						break;
				}
			}

			// Invoice: Date issue filter
			if (filters.date_issue && filters.date_issue.value.trim() !== "") {
				const filterValue = filters.date_issue.value;
				const itemValue = String(item.date_issue || "");

				switch (filters.date_issue.comparator) {
					case '>':
						if (!(itemValue > filterValue)) return false;
						break;
					case '=':
						if (itemValue !== filterValue) return false;
						break;
					case '<':
						if (!(itemValue < filterValue)) return false;
						break;
				}
			}

			// Invoice: Date due filter (dynamic)
			if (filters.date_due && filters.date_due.value.trim() !== "") {
				const filterValue = filters.date_due.value;
				const itemValue = String(item.date_due || "");

				switch (filters.date_due.comparator) {
					case '>':
						if (!(itemValue > filterValue)) return false;
						break;
					case '=':
						if (itemValue !== filterValue) return false;
						break;
					case '<':
						if (!(itemValue < filterValue)) return false;
						break;
				}
			}

			// Invoice: Date tax filter (dynamic)
			if (filters.date_tax && filters.date_tax.value.trim() !== "") {
				const filterValue = filters.date_tax.value;
				const itemValue = String(item.date_tax || "");

				switch (filters.date_tax.comparator) {
					case '>':
						if (!(itemValue > filterValue)) return false;
						break;
					case '=':
						if (itemValue !== filterValue) return false;
						break;
					case '<':
						if (!(itemValue < filterValue)) return false;
						break;
				}
			}

			// Item: Price filter with VAT checkbox and price groups
			if (filters.price && filters.price.value.trim() !== "") {
				const filterValue = parseFloat(filters.price.value);
				const useVat = filters.price_with_vat === true;
				const selectedGroups = filters.price_groups || [1, 2, 3, 4];

				// Check if item matches ANY selected price group
				const matchesAnyGroup = selectedGroups.some((groupNum: number) => {
					const priceField = `sale_price_group${groupNum}`;
					let itemPrice = parseFloat(item[priceField]) || 0;

					// Apply VAT if checkbox is checked
					if (useVat && item.vat_rate !== undefined) {
						const vatRates = [0, 21, 12]; // 0%, 21%, 12%
						const vatRate = vatRates[item.vat_rate] || 0;
						itemPrice = itemPrice * (1 + vatRate / 100);
					}

					// Apply comparator
					switch (filters.price.comparator) {
						case '>':
							return itemPrice > filterValue;
						case '=':
							return itemPrice === filterValue;
						case '<':
							return itemPrice < filterValue;
						default:
							return false;
					}
				});

				if (!matchesAnyGroup) return false;
			}

			return true;
		});
	}, [data, filters]);
}
