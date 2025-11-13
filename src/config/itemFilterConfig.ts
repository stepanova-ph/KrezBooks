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

		{
			id: "price_aggregate",
			type: "filter-aggregate",
			label: "Cena",
			columnId: "sale_price_group1",
			collapsible: true,
			defaultExpanded: false,
			lockPrimaryWhenExpanded: true,
			primaryFilter: {
				id: "price",
				type: "number-comparator",
				label: "Cena",
				field: "price",
				placeholder: "0",
				allowNegative: false,
				width: 120,
			},
			expandedFilters: [
				{
					id: "price_with_vat",
					type: "checkbox",
					label: "S DPH",
					field: "price_with_vat",
				},
				{
					id: "price_groups",
					type: "multiselect",
					label: "Cenová skupina",
					field: "price_groups",
					options: [
						{ value: 1, label: "Skupina 1" },
						{ value: 2, label: "Skupina 2" },
						{ value: 3, label: "Skupina 3" },
						{ value: 4, label: "Skupina 4" },
					],
					placeholder: "Všechny skupiny",
				},
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
	unit_of_measure: "",
	category: [],
	stock_amount: { value: "", comparator: ">" },
	price: { value: "", comparator: ">" },
	price_with_vat: false,
	price_groups: [1, 2, 3, 4], // All groups selected by default
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
