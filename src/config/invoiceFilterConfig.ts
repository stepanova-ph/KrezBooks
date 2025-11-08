import { FilterConfig } from "../types/filter";

export const invoiceFilterConfig: FilterConfig = {
	filters: [
		{
			id: "search",
			type: "text-search",
			label: "Hledat",
			placeholder: "Číslo dokladu, firma...",
			searchFields: ["number", "company_name", "variable_symbol"],
			columnId: null,
			width: 200,
		},
	],
};

export const initialInvoiceFilterState = {
	search: "",
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
