import { useState, useCallback } from "react";

export function useColumnVisibility(defaultColumns: string[]) {
	const [visibleColumnIds, setVisibleColumnIds] = useState<Set<string>>(
		new Set(defaultColumns),
	);
	const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumns);

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
