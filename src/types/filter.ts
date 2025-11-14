import { ReactNode } from "react";
import { InvoiceType } from "./database";

/**
 * Filter types supported by the FilterBar component
 */
export type FilterType =
	| "text-search" // Global search across multiple fields
	| "checkbox" // Boolean toggle
	| "number-input" // Number-only input with autocomplete
	| "number-with-prefix" // Special: number with country prefix selector (DIC)
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
	columnId?: string | null; // Which column this filter is tied to (null = always visible)
	width?: number; // Custom width in pixels (optional)
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
	field: string; // Field name in data object
	group?: string; // Group name for required validation
	required?: boolean; // If true, at least one in group must be checked
}

/**
 * Number input filter
 */
export interface NumberInputFilterDef extends BaseFilterDef {
	type: "number-input";
	field: string;
	placeholder?: string;
	autocomplete?: boolean; // If true, allows partial matching
	maxLength?: number;
	validate?: (value: string) => { valid: boolean; error?: string };
}

/**
 * Number with prefix filter (for DIC)
 */
export interface NumberWithPrefixFilterDef extends BaseFilterDef {
	type: "number-with-prefix";
	field: string;
	prefixes: string[]; // e.g., ['CZ', 'SK', 'vlastní']
	prefixWidth?: number; // Custom width for prefix dropdown (optional)
	placeholder?: string;
	customPlaceholder?: string; // Placeholder when "vlastní" is selected
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
}

/**
 * Multi-select filter (multiple choices)
 */
export interface MultiSelectFilterDef extends BaseFilterDef {
	type: "multiselect";
	field: string;
	options: Array<{ value: string | number; label: string }>;
	placeholder?: string;
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
	actionId: string; // references FilterAction.id
	variant?: "text" | "outlined" | "contained";
}

/**
 * Filter aggregate - groups multiple filters with collapsible UI
 * Primary filter shown when collapsed, additional controls when expanded
 */
export interface FilterAggregateFilterDef extends BaseFilterDef {
	type: "filter-aggregate";
	collapsible: boolean;
	defaultExpanded?: boolean; // default: false
	primaryFilter: FilterDef; // shown always, locked when expanded
	expandedFilters: Array<FilterDef | ActionButtonFilterDef>; // shown when expanded
	lockPrimaryWhenExpanded?: boolean; // default: true - disables primary comparator
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
	ico?: string;
	modifier?: number;
	total_amount?: { greaterThan?: string; equals?: string; lessThan?: string; comparator: '>' | '=' | '<' };
	total_amount_with_vat?: boolean;
	date_issue?: { greaterThan?: string; equals?: string; lessThan?: string; comparator: '>' | '=' | '<' };
	date_due?: { greaterThan?: string; equals?: string; lessThan?: string; comparator: '>' | '=' | '<' };
	date_tax?: { greaterThan?: string; equals?: string; lessThan?: string; comparator: '>' | '=' | '<' };
	_dynamicFilters?: string[]; // IDs of dynamically added filters
}

/**
 * Filter state for items
 */
export interface ItemFilterState {
	search: string;
	vat_rate: number[]; // Multiple selection
	unit_of_measure: string; // Text search
	category: string[]; // Text search
	stock_amount?: { value: string; comparator: '>' | '=' | '<' }; // Number comparator
	price?: { value: string; comparator: '>' | '=' | '<' }; // Number comparator
	price_with_vat?: boolean;
	price_groups?: number[]; // Selected price groups (1-4)
}

/**
 * Generic filter state
 */
export type FilterState = {
	[filterId: string]: any;
	_aggregateExpanded?: {
		[aggregateId: string]: boolean;
	};
	_dynamicFilters?: string[]; // IDs of dynamically added filters
};

/**
 * Filter action button definition
 */
export type FilterAction = {
	id: string;
	label: string;
	variant?: "contained" | "outlined" | "text";
	startIcon?: ReactNode;
	onClick?: () => void; // if you want to handle it in parent
	renderDialog?: (props: { open: boolean; onClose: () => void }) => ReactNode; // if you want FilterBar to open a modal for you
};

