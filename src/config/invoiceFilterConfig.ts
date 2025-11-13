import { FilterConfig, FilterAggregateFilterDef } from "../types/filter";

// Dynamic filter definitions that can be added on demand
export const dateDueFilter: FilterAggregateFilterDef = {
	id: "date_due_aggregate",
	type: "filter-aggregate",
	label: "Datum splatnosti",
	columnId: "date_due",
	collapsible: false,
	primaryFilter: {
		id: "date_due",
		type: "date-comparator",  // CHANGED
		label: "Datum splatnosti",
		field: "date_due",
		width: 150,
	},
	expandedFilters: [],
};


export const dateTaxFilter: FilterAggregateFilterDef = {
	id: "date_tax_aggregate",
	type: "filter-aggregate",
	label: "Datum zdanění",
	columnId: "date_tax",
	collapsible: false,
	primaryFilter: {
		id: "date_tax",
		type: "date-comparator",  // CHANGED
		label: "Datum zdanění",
		field: "date_tax",
		width: 150,
	},
	expandedFilters: [],
};

export const invoiceFilterConfig: FilterConfig = {
	filters: [
		{
			id: "search",
			type: "text-search",
			label: "Hledat",
			placeholder: "Číslo dokladu, firma...",
			searchFields: [
				{ field: "number" },
				{ field: "company_name" },
				{ field: "variable_symbol" }
			],
			columnId: null,
			width: 200,
		},

		{
			id: "total_amount_aggregate",
			type: "filter-aggregate",
			label: "Celková částka",
			columnId: "total_amount",
			collapsible: true,
			defaultExpanded: false,
			lockPrimaryWhenExpanded: true,
			primaryFilter: {
				id: "total_amount",
				type: "number-comparator",
				label: "Částka",
				field: "total_amount",
				placeholder: "0",
				allowNegative: false,
				width: 120,
			},
			expandedFilters: [
				{
					id: "total_amount_with_vat",
					type: "checkbox",
					label: "S DPH",
					field: "total_amount_with_vat",
				},
			],
		},

		{
			id: "date_issue_aggregate",
			type: "filter-aggregate",
			label: "Datum vystavení",
			columnId: "date_issue",
			collapsible: true,
			defaultExpanded: false,
			lockPrimaryWhenExpanded: true,
			primaryFilter: {
				id: "date_issue",
				type: "date-comparator",  // CHANGED
				label: "Datum",
				field: "date_issue",
				width: 150,
			},
			expandedFilters: [
				{
					id: "add_date_due_btn",
					type: "action-button",
					label: "Datum splatnosti",
					actionId: "add_date_due_filter",
					variant: "outlined",
				},
				{
					id: "add_date_tax_btn",
					type: "action-button",
					label: "Datum zdanění",
					actionId: "add_date_tax_filter",
					variant: "outlined",
				},
			],
		},
	],
};

export const initialInvoiceFilterState = {
	search: "",
	total_amount: { greaterThan: "", equals: "", lessThan: "", comparator: ">" },
	total_amount_with_vat: false,
	date_issue: { greaterThan: "", equals: "", lessThan: "", comparator: ">" },
	_dynamicFilters: [],
};

export const defaultVisibleColumnsInvoice = [
	"number",
	"type",
	"date_issue",
	"company_name",
	"total",
];

export const defaultVisibleColumnsInvoiceItems = [
	"ean",
	"name",
	"amount",
	"unit_of_measure",
	"sale_price",
	"total",
];
