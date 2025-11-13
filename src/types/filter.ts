import { ReactNode } from "react";

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
	| "number-comparator"; // ADD THIS

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
	| NumberComparatorFilterDef;

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
 * Filter state for items
 */
export interface ItemFilterState {
	search: string;
	vat_rate: number[]; // Multiple selection
	unit_of_measure: string; // Text search
	category: string[]; // Text search
	stock_amount?: { value: string; comparator: '>' | '=' | '<' }; // Number comparator
}

/**
 * Generic filter state
 */
export type FilterState = Record<string, any>;

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

