import { ReactNode } from "react";

/**
 * Filter types supported by the FilterBar component
 */
export type FilterType =
	| "text-search" // Global search across multiple fields
	| "checkbox" // Boolean toggle
	| "number-input" // Number-only input with autocomplete
	| "number-with-prefix" // Number with country prefix selector (DIC)
	| "select" // Single selection dropdown
	| "multiselect" // Multiple selection dropdown
	| "number-comparator" // Number with comparator (>, =, <)
	| "date-comparator" // Date with comparator (>, =, <)	
	| "filter-aggregate" // Groups multiple filters with collapsible UI
	| "action-button"; // Clickable button that triggers FilterAction

/**
 * Base filter definition
 */
export interface BaseFilterDef {
	id: string;
	type: FilterType;
	label: string;
	columnId?: string | null; // columnId the filter is tied to (null = always visible)
	width?: number;
}

/**
 * Text search filter - searches across multiple fields
 */
export interface TextSearchFilterDef extends BaseFilterDef {
	type: "text-search";
	placeholder?: string;
	searchFields: {
		field: string;
		match?: (...args: any[]) => boolean;
	}[];
}

/**
 * Checkbox filter
 */
export interface CheckboxFilterDef extends BaseFilterDef {
	type: "checkbox";
	field: string;
	group?: string;
	required?: boolean;
}

/**
 * Number input filter
 */
export interface NumberInputFilterDef extends BaseFilterDef {
	type: "number-input";
	field: string;
	placeholder?: string;
	autocomplete?: boolean; // allow partial matching
	maxLength?: number;
	validate?: (value: string) => { valid: boolean; error?: string };
}

/**
 * Number with prefix filter (for DIC)
 */
export interface NumberWithPrefixFilterDef extends BaseFilterDef {
	type: "number-with-prefix";
	field: string;
	prefixes: string[];
	prefixWidth?: number;
	placeholder?: string;
	customPlaceholder?: string;
	autocomplete?: boolean;
	validate?: (
		prefix: string | null,
		value: string,
	) => { valid: boolean; error?: string };
}

/**
 * Select filter (single choice)
 */
export interface SelectFilterDef extends BaseFilterDef {
	type: "select";
	field: string;
	options: Array<{ value: string | number; label: string }>;
	placeholder?: string;
	useShortLabels?: boolean;
}

/**
 * Multi-select filter (multiple choices)
 */
export interface MultiSelectFilterDef extends BaseFilterDef {
	type: "multiselect";
	field: string;
	options: Array<{ value: string | number; label: string }>;
	placeholder?: string;
	useShortLabels?: boolean;
}

/**
 * Number comparator filter (for amount filtering with >, =, <)
 */
export interface NumberComparatorFilterDef extends BaseFilterDef {
	type: "number-comparator";
	field: string;
	placeholder?: string;
	allowNegative?: boolean;
}

export interface DateComparatorFilterDef extends BaseFilterDef {
	type: "date-comparator";
	field: string;
}

/**
 * Action button filter - clickable button that triggers FilterAction
 */
export interface ActionButtonFilterDef extends BaseFilterDef {
	type: "action-button";
	actionId: string; // FilterAction.id
	variant?: "text" | "outlined" | "contained";
}

/**
 * Filter aggregate - groups multiple filters with collapsible UI
 * Primary filter shown when collapsed, additional controls when expanded
 */
export interface FilterAggregateFilterDef extends BaseFilterDef {
	type: "filter-aggregate";
	collapsible: boolean;
	defaultExpanded?: boolean;
	primaryFilter: FilterDef;
	expandedFilters: Array<FilterDef | ActionButtonFilterDef>;
	lockPrimaryWhenExpanded?: boolean;
}

/**
 * Union of all filter definition types
 */
export type FilterDef =
	| TextSearchFilterDef
	| CheckboxFilterDef
	| NumberInputFilterDef
	| NumberWithPrefixFilterDef
	| SelectFilterDef
	| MultiSelectFilterDef
	| NumberComparatorFilterDef
	| DateComparatorFilterDef
	| FilterAggregateFilterDef
	| ActionButtonFilterDef;

/**
 * Filter configuration for a table
 */
export interface FilterConfig {
	filters: FilterDef[];
}

/**
 * Filter state for contacts
 */
export interface ContactFilterState {
	search: string;
	is_supplier: boolean;
	is_customer: boolean;
	ico: string;
	dic: string;
	price_group: string[];
}

/**
 * Filter state for invoices
 */
export interface InvoiceFilterState {
	search: string;
	type?: number[];
	selectedContacts?: Array<{ ico: string; modifier: number }>;  // NEW: array of contacts
	total_amount?: { greaterThan?: string; equals?: string; lessThan?: string; comparator: '>' | '=' | '<' };
	total_amount_with_vat?: boolean;
	date_issue?: { greaterThan?: string; equals?: string; lessThan?: string; comparator: '>' | '=' | '<' };
	date_due?: { greaterThan?: string; equals?: string; lessThan?: string; comparator: '>' | '=' | '<' };
	date_tax?: { greaterThan?: string; equals?: string; lessThan?: string; comparator: '>' | '=' | '<' };
	_dynamicFilters?: string[];
}

/**
 * Filter state for items
 */
export interface ItemFilterState {
	search: string;
	vat_rate: number[];
	unit_of_measure: string;
	category: string[];
	stock_amount?: { greaterThan: string; equals: string; lessThan: string; comparator: '>' | '=' | '<' }; // Number comparator
	price?: { greaterThan: string; equals: string; lessThan: string; comparator: '>' | '=' | '<' }; // Number comparator
	price_with_vat?: boolean;
	price_groups?: number[];
}

/**
 * Generic filter state
 */
export type FilterState = {
	[filterId: string]: any;
	_aggregateExpanded?: {
		[aggregateId: string]: boolean;
	};
	_dynamicFilters?: string[];
};

/**
 * Filter action button definition
 */
export type FilterAction = {
	id: string;
	label: string;
	variant?: "contained" | "outlined" | "text";
	startIcon?: ReactNode;
	onClick?: () => void;
	renderDialog?: (props: { open: boolean; onClose: () => void }) => ReactNode; // if you want FilterBar to open a modal for you
};

