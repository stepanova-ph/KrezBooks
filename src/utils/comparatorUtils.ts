// Add helper function at the top of useTableFilters.ts, before the main hook

/**
 * Apply number comparator filter with range support
 * Handles new format { greaterThan, equals, lessThan, comparator }
 */
export function applyNumberComparatorFilter(
	itemValue: number,
	filterValue: any,
): boolean {
	if (!filterValue) return true;

	const { greaterThan, equals, lessThan } = filterValue;

	// Check greater than
	if (greaterThan && greaterThan.trim() !== "") {
		const gtValue = parseFloat(greaterThan);
		if (!(itemValue > gtValue)) return false;
	}

	// Check equals
	if (equals && equals.trim() !== "") {
		const eqValue = parseFloat(equals);
		if (itemValue !== eqValue) return false;
	}

	// Check less than
	if (lessThan && lessThan.trim() !== "") {
		const ltValue = parseFloat(lessThan);
		if (!(itemValue < ltValue)) return false;
	}

	return true;
}

/**
 * Apply date comparator filter with range support
 * Handles new format { greaterThan, equals, lessThan, comparator }
 */
export function applyDateComparatorFilter(
	itemValue: string,
	filterValue: any,
): boolean {
	if (!filterValue) return true;

	const { greaterThan, equals, lessThan } = filterValue;

	// Check equals
	if (equals && equals.trim() !== "") {
		return itemValue === equals;
	}

	if (greaterThan && greaterThan.trim() !== "") {
		if (!(itemValue > greaterThan)) return false;
	}

	if (lessThan && lessThan.trim() !== "") {
		if (!(itemValue < lessThan)) return false;
	}

	return true;
}
