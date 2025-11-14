import { FilterConfig, FilterAggregateFilterDef, InvoiceFilterState } from "../types/filter";

// Dynamic filter definitions that can be added on demand
export const dateDueFilter: FilterAggregateFilterDef = {
	id: "date_due_aggregate",
	type: "filter-aggregate",
	label: "Datum splatnosti",
	columnId: "date_due",
	collapsible: true,
	primaryFilter: {
		id: "date_due",
		type: "date-comparator",
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
	collapsible: true,
	primaryFilter: {
		id: "date_tax",
		type: "date-comparator",
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
			placeholder: "Číslo, firma, IČO...",
			searchFields: [
				{ field: "ico" },
				{ field: "company_name" },
				{ field: "number" },
				{ field: "prefix" },
				{ 
					field: "prefixNumber",
					match: (invoice: any, query: string) => {
						const combined = `${invoice.prefix || ""}${invoice.number}`;
						return combined.toLowerCase().includes(query.toLowerCase());
					}
				},
			],
			columnId: null,
			width: 180,
		},
		{
			id: "type",
			type: "multiselect",
			label: "Typ",
			field: "type",
			columnId: "type",
			placeholder: "Všechny typy",
			options: [
				{ value: 1, label: "Nákup (hotovost)" },
				{ value: 2, label: "Nákup (faktura)" },
				{ value: 3, label: "Prodej (hotovost)" },
				{ value: 4, label: "Prodej (faktura)" },
				{ value: 5, label: "Korekce skladu" },
			],
			width: 100,
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
				width: 80,
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
				type: "date-comparator",
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

export const initialInvoiceFilterState: InvoiceFilterState = {
	search: "",
	type: [],
	selectedContacts: [],
	total_amount: { greaterThan: "", equals: "", lessThan: "", comparator: ">" },
	total_amount_with_vat: false,
	date_issue: { greaterThan: "", equals: "", lessThan: "", comparator: ">" },
	date_due: { greaterThan: "", equals: "", lessThan: "", comparator: ">" },
	date_tax: { greaterThan: "", equals: "", lessThan: "", comparator: ">" },
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