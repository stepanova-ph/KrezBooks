import { validateFilterDIC, validateFilterICO } from "../utils/filterUtils";
import { ContactFilterState, FilterConfig } from "../types/filter";
import { matchPhone } from "../utils/matchUtils";

/**
 * Filter configuration for Contacts table
 */
export const contactFilterConfig: FilterConfig = {
	filters: [
		{
			id: "search",
			type: "text-search",
			label: "Hledat",
			placeholder: "Název, město, telefon, email...",
			searchFields: [
				{ field: "company_name" },
				{ field: "representative_name" },
				{ field: "city" },
				{ field: "street" },
				{ field: "phone", match: matchPhone },
				{ field: "email" },
				{ field: "website" },
			],
			columnId: null,
			width: 200,
		},

		// Supplier/Customer checkboxes (required group)
		{
			id: "is_supplier",
			type: "checkbox",
			label: "Dodavatel",
			field: "is_supplier",
			columnId: "type",
			group: "contact_type",
			required: false,
		},
		{
			id: "is_customer",
			type: "checkbox",
			label: "Odběratel",
			field: "is_customer",
			columnId: "type",
			group: "contact_type",
			required: false,
		},

		// ICO filter with validation
		{
			id: "ico",
			type: "number-input",
			label: "IČO",
			field: "ico",
			columnId: "ico",
			placeholder: "12345678",
			maxLength: 8,
			autocomplete: true,
			validate: validateFilterICO,
			width: 110,
		},

		{
			id: "dic",
			type: "number-input",
			label: "DIČ",
			field: "dic",
			columnId: "dic",
			placeholder: "CZ12345678",
			maxLength: 12,
			autocomplete: true,
			validate: validateFilterDIC,
			width: 150,
		},

		{
			id: "price_group",
			type: "multiselect",
			label: "Skupina",
			field: "price_group",
			columnId: "price_group",
			placeholder: "Vše",
			options: [
				{ value: 1, label: "1" },
				{ value: 2, label: "2" },
				{ value: 3, label: "3" },
				{ value: 4, label: "4" },
			],
			width: 95,
		},
	],
};

/**
 * Initial/default filter state for contacts
 */
export const initialContactFilterState: ContactFilterState = {
	search: "",
	is_supplier: false,
	is_customer: false,
	ico: "",
	dic: "",
	price_group: [],
};

export const defaultVisibleColumnsContact = [
	"ico",
	"company_name",
	"city",
	"email",
	"type",
	"price_group",
];
