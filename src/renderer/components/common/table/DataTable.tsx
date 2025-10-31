import { useEffect, useCallback } from "react";
import {
	TableControlsProvider,
	useTableControls,
} from "../../../../context/TableControlsContext";
import { useKeyboardShortcuts } from "../../../../hooks/keyboard/useKeyboardShortcuts";
import { DataTableContent } from "./DataTableContent";
import type { OrderByConfig } from "../filtering/ColumnSelectorButton";

export interface Column {
	id: string;
	label: string;
	align?: "left" | "right" | "center";
	minWidth?: number;
	maxWidth?: number;
	width?: number;
	hidden?: true;
	hide_label?: true;
}

export type ContextMenuAction<T = any> = {
	id: string;
	label: string;
	icon?: React.ReactNode;
	onClick: (item: T) => void | Promise<void>;
	requireConfirm?: boolean;
	confirmMessage?: string | ((item: T) => string);
	divider?: boolean;
};

interface DataTableProps<T> {
	columns: Column[];
	data: T[];
	renderRow: (
		item: T,
		visibleColumns: Column[],
		isFocused: boolean,
	) => React.ReactNode;
	emptyMessage?: string;
	visibleColumnIds: Set<string>;
	contextMenuActions?: ContextMenuAction<T>[];
	getRowKey?: (item: T) => string | number;
	columnOrder?: string[];
	onColumnOrderChange?: (newOrder: string[]) => void;
	onEnterAction?: (item: T, index: number) => void;
	onRowClick?: (item: T, index: number) => void;
	onRowDoubleClick?: (item: T, index: number) => void;
	orderBy?: OrderByConfig;
	getCellContent?: (item: T, columnId: string) => any;
	onFocusChange?: (item: T | null) => void;
	disableDrag?: true;
}

function DataTableInner<T>(props: DataTableProps<T>) {
	const controls = useTableControls<T>();

	// Setup keyboard shortcuts
	useKeyboardShortcuts(
		{
			ArrowUp: controls.moveUp,
			ArrowDown: controls.moveDown,
			PageUp: controls.movePageUp,
			PageDown: controls.movePageDown,
			Home: controls.moveToTop,
			End: controls.moveToBottom,
			Enter: controls.enter,
		},
		{
			disabled: props.data.length === 0,
			preventInInputs: true,
		},
	);

	// Update data in context whenever it changes
	useEffect(() => {
		controls.setData(props.data, props.getRowKey || ((item: any) => item.id));
	}, [props.data, props.getRowKey, controls]);

	// STABLE CALLBACK - doesn't change on every render
	const handleEnter = useCallback(() => {
		if (props.onEnterAction && controls.focusedItem !== null) {
			props.onEnterAction(controls.focusedItem, controls.focusedIndex);
		}
	}, [props.onEnterAction, controls.focusedItem, controls.focusedIndex]);

	// Setup enter callback - ONLY UPDATE WHEN CALLBACK CHANGES
	useEffect(() => {
		if (props.onEnterAction) {
			controls.setOnEnterPress(handleEnter);
		} else {
			controls.setOnEnterPress(undefined);
		}
	}, [handleEnter, props.onEnterAction, controls]);

	// Notify parent of focus changes
	useEffect(() => {
		if (props.onFocusChange) {
			props.onFocusChange(controls.focusedItem);
		}
	}, [controls.focusedItem, props.onFocusChange]);

	return <DataTableContent {...props} />;
}

export function DataTable<T>(props: DataTableProps<T>) {
	return (
		<TableControlsProvider<T>>
			<DataTableInner {...props} />
		</TableControlsProvider>
	);
}