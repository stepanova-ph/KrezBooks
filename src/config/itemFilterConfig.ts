import { FilterConfig, ItemFilterState } from "../types/filter";

/**
 * Filter configuration for Items table
 */
export const itemFilterConfig: FilterConfig = {
	filters: [
		{
			id: "search",
			type: "text-search",
			label: "Hledat",
			placeholder: "Název, poznámka...",
			searchFields: [{ field: "name" }, { field: "note" }],
			columnId: null, // Always visible
		},

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
		{
			id: "unit_of_measure",
			type: "text-search",
			label: "Měrná jednotka",
			columnId: "unit_of_measure",
			placeholder: "Hledat jednotku...",
			searchFields: [{ field: "unit_of_measure" }],
		},
		{
			id: "category",
			type: "multiselect",
			field: "category",
			label: "Kategorie",
			columnId: "category",
			placeholder: "Všechny kategorie",
			options: [],
		},
		{
			id: "stock_amount",
			type: "number-comparator",
			label: "Množství",
			field: "stock_amount",
			columnId: "stock_amount",
			placeholder: "0",
			allowNegative: true,
			width: 100,
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
	stock_amount: { value: "", comparator: ">" },
};

export const defaultVisibleColumnsItem = [
	"ean",
	"name",
	"category",
	"unit",
	"vat",
	"stock_amount",
	"sale_price_group1",
	"sale_price_group2",
];
