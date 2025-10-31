import {
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	Box,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Divider,
} from "@mui/material";
import { useState, MouseEvent, useMemo } from "react";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
	restrictToHorizontalAxis,
	restrictToFirstScrollableAncestor,
} from "@dnd-kit/modifiers";
import DraggableHeaderCell from "./DraggableHeaderCell";
import { useTableControls } from "../../../../context/TableControlsContext";
import { ConfirmDialog } from "../dialog/ConfirmDialog";
import type { Column, ContextMenuAction } from "./DataTable";
import type { OrderByConfig } from "../filtering/ColumnSelectorButton";

interface DataTableContentProps<T> {
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
	onRowClick?: (item: T, index: number) => void;
	onRowDoubleClick?: (item: T, index: number) => void;
	orderBy?: OrderByConfig;
	getCellContent?: (item: T, columnId: string) => any;
	disableDrag?:true;
}

export function DataTableContent<T>({
	columns,
	data,
	renderRow,
	emptyMessage = "Žádná data k zobrazení",
	visibleColumnIds,
	contextMenuActions = [],
	getRowKey = (item: any) => item.id,
	columnOrder,
	onColumnOrderChange,
	onRowClick,
	onRowDoubleClick,
	orderBy,
	getCellContent,
	disableDrag,
}: DataTableContentProps<T>) {
	const controls = useTableControls<T>();

	const visibleColumns = columns.filter((col) => visibleColumnIds.has(col.id));

	const orderedColumns = columnOrder
		? columnOrder
				.map((id) => visibleColumns.find((col) => col.id === id))
				.filter((col): col is Column => col !== undefined)
		: visibleColumns;

	// Sort data based on orderBy config
	const sortedData = useMemo(() => {
		if (!orderBy || !orderBy.columnId) {
			return data;
		}

		const sorted = [...data].sort((a, b) => {
			let aValue: any;
			let bValue: any;

			if (getCellContent) {
				aValue = getCellContent(a, orderBy.columnId!);
				bValue = getCellContent(b, orderBy.columnId!);
			} else {
				aValue = (a as any)[orderBy.columnId!];
				bValue = (b as any)[orderBy.columnId!];
			}

			// Handle null/undefined
			if (aValue == null && bValue == null) return 0;
			if (aValue == null) return 1;
			if (bValue == null) return -1;

			// Convert to string for comparison
			const aStr = String(aValue).toLowerCase();
			const bStr = String(bValue).toLowerCase();

			// Try numeric comparison if both are numbers
			const aNum = Number(aValue);
			const bNum = Number(bValue);
			if (!isNaN(aNum) && !isNaN(bNum)) {
				return orderBy.order === "asc" ? aNum - bNum : bNum - aNum;
			}

			// String comparison
			if (aStr < bStr) return orderBy.order === "asc" ? -1 : 1;
			if (aStr > bStr) return orderBy.order === "asc" ? 1 : -1;
			return 0;
		});

		return sorted;
	}, [data, orderBy, getCellContent]);

	const [contextMenu, setContextMenu] = useState<{
		mouseX: number;
		mouseY: number;
		item: T | null;
	} | null>(null);

	const [confirmDialog, setConfirmDialog] = useState<{
		open: boolean;
		action: ContextMenuAction<T> | null;
		item: T | null;
	}>({
		open: false,
		action: null,
		item: null,
	});

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = orderedColumns.findIndex((col) => col.id === active.id);
			const newIndex = orderedColumns.findIndex((col) => col.id === over.id);

			const newOrder = arrayMove(orderedColumns, oldIndex, newIndex).map(
				(col) => col.id,
			);

			if (onColumnOrderChange) {
				onColumnOrderChange(newOrder);
			}
		}
	};

	const handleRowMouseEnter = (index: number) => {
		controls.setFocusedIndex(index);
	};

	const handleRowClick = (item: T, index: number) => {
		controls.setFocusedIndex(index);
		onRowClick?.(item, index);
	};

	const handleRowDoubleClick = (item: T, index: number) => {
		onRowDoubleClick?.(item, index);
	};

	const handleContextMenu = (event: MouseEvent, item: T, index: number) => {
		event.preventDefault();
		controls.setFocusedIndex(index);

		setContextMenu({
			mouseX: event.clientX + 2,
			mouseY: event.clientY - 6,
			item,
		});
	};

	const handleCloseContextMenu = () => {
		setContextMenu(null);
	};

	const handleActionClick = async (action: ContextMenuAction<T>) => {
		if (!contextMenu?.item) return;

		handleCloseContextMenu();

		if (action.requireConfirm) {
			setConfirmDialog({
				open: true,
				action,
				item: contextMenu.item,
			});
		} else {
			await action.onClick(contextMenu.item);
		}
	};

	const handleConfirmAction = async () => {
		if (confirmDialog.action && confirmDialog.item) {
			await confirmDialog.action.onClick(confirmDialog.item);
		}
		setConfirmDialog({ open: false, action: null, item: null });
	};

	const handleCancelConfirm = () => {
		setConfirmDialog({ open: false, action: null, item: null });
	};

	const getConfirmMessage = () => {
		if (!confirmDialog.action || !confirmDialog.item) return "";

		const message = confirmDialog.action.confirmMessage;
		if (typeof message === "function") {
			return message(confirmDialog.item);
		}
		return message || "Opravdu chcete provést tuto akci?";
	};

	return (
		<Box>
			<TableContainer
				component={Paper}
				sx={{
					boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
					border: (theme) => `1px solid ${theme.palette.divider}`,
					overflow: "auto",
					position: "relative",
				}}
			>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
					modifiers={[
						restrictToHorizontalAxis,
						restrictToFirstScrollableAncestor,
					]}
				>
					<Table stickyHeader size="small">
						<TableHead>
							<TableRow>
								<SortableContext
									items={orderedColumns.map((col) => col.id)}
									strategy={horizontalListSortingStrategy}
								>
									{orderedColumns
										.filter((col) => !col.hidden)
										.map((column) => (
											<DraggableHeaderCell
												key={column.id}
												column={column}
												disabled={disableDrag}
											/>
										))}
								</SortableContext>
							</TableRow>
						</TableHead>

						<TableBody>
							{sortedData.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={orderedColumns.filter((col) => !col.hidden).length}
										sx={{ py: 8 }}
									>
										<Typography
											variant="body2"
											color="text.secondary"
											align="center"
										>
											{emptyMessage}
										</Typography>
									</TableCell>
								</TableRow>
							) : (
								sortedData.map((item, index) => {
									const key = getRowKey(item);
									const isFocused = controls.focusedIndex === index;

									return (
										<TableRow
											key={key}
											ref={controls.setRowRef(index)}
											hover
											onMouseEnter={() => handleRowMouseEnter(index)}
											onClick={() => handleRowClick(item, index)}
											onDoubleClick={() => handleRowDoubleClick(item, index)}
											onContextMenu={(e) => handleContextMenu(e, item, index)}
											sx={{
												cursor: "pointer",
												bgcolor: isFocused
													? "action.selected"
													: "background.paper",
												"&:hover": {
													bgcolor: isFocused
														? "action.selected"
														: "action.hover",
												},
											}}
										>
											{renderRow(item, orderedColumns, isFocused)}
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</DndContext>
			</TableContainer>

			{/* Context Menu */}
			<Menu
				open={contextMenu !== null}
				onClose={handleCloseContextMenu}
				anchorReference="anchorPosition"
				anchorPosition={
					contextMenu !== null
						? { top: contextMenu.mouseY, left: contextMenu.mouseX }
						: undefined
				}
			>
				{contextMenuActions.map((action, index) => {
					const showDivider = action.divider && index < contextMenuActions.length - 1;

					return (
						<Box key={action.id}>
							<MenuItem onClick={() => handleActionClick(action)}>
								{action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
								<ListItemText>{action.label}</ListItemText>
							</MenuItem>
							{showDivider && <Divider />}
						</Box>
					);
				})}
			</Menu>

			{/* Confirm Dialog */}
			<ConfirmDialog
				open={confirmDialog.open}
				title="Potvrdit akci"
				message={getConfirmMessage()}
				onConfirm={handleConfirmAction}
				onCancel={handleCancelConfirm}
			/>
		</Box>
	);
}