import { useState, useCallback, useEffect } from "react";
import { storage, ORDER_STORAGE_KEYS } from "../utils/storageUtils";

export function useColumnVisibility(
	defaultColumns: string[],
	storageKey: keyof typeof ORDER_STORAGE_KEYS,
) {
	// load columnOrder on mount
	const getInitialColumnOrder = () => {
		const stored = storage.get<string[]>(ORDER_STORAGE_KEYS[storageKey]);
		if (stored) {
			// Validate that stored columns still exist in defaultColumns
			const valid = stored.filter((id) => defaultColumns.includes(id));
			if (valid.length > 0) return valid;
		}
		return defaultColumns;
	};

	const [visibleColumnIds, setVisibleColumnIds] = useState<Set<string>>(
		new Set(defaultColumns),
	);
	const [columnOrder, setColumnOrder] = useState<string[]>(
		getInitialColumnOrder,
	);

	// save columnOrder when it changes
	useEffect(() => {
		storage.set(ORDER_STORAGE_KEYS[storageKey], columnOrder);
	}, [columnOrder, storageKey]);

	const handleVisibleColumnsChange = useCallback(
		(newVisibleColumnIds: Set<string>) => {
			setVisibleColumnIds(newVisibleColumnIds);

			const isResettingToDefault =
				newVisibleColumnIds.size === defaultColumns.length &&
				defaultColumns.every((id) => newVisibleColumnIds.has(id));

			if (isResettingToDefault) {
				setColumnOrder(defaultColumns);
			} else {
				const newVisibleArray = Array.from(newVisibleColumnIds);
				const orderedVisible = columnOrder.filter((id) =>
					newVisibleColumnIds.has(id),
				);
				const newColumns = newVisibleArray.filter(
					(id) => !columnOrder.includes(id),
				);

				setColumnOrder([...orderedVisible, ...newColumns]);
			}
		},
		[defaultColumns, columnOrder],
	);

	return {
		visibleColumnIds,
		columnOrder,
		handleVisibleColumnsChange,
		setColumnOrder,
	};
}
