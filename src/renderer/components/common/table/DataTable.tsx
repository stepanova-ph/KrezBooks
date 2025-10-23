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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useState, MouseEvent, useCallback, useRef } from "react";
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
import { useTableNavigation } from "../../../../hooks/keyboard/useTableNavigation";

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
  renderRow: (item: T, visibleColumns: Column[]) => React.ReactNode;
  emptyMessage?: string;
  visibleColumnIds: Set<string>;
  contextMenuActions?: ContextMenuAction<T>[];
  getRowKey?: (item: T) => string | number;
  columnOrder?: string[];
  onColumnOrderChange?: (newOrder: string[]) => void;
  onEnterAction?: (item: T, index: number) => void;
  onRowClick?: (item: T, index: number) => void;
  onRowDoubleClick?: (item: T, index: number) => void;
}

export function DataTable<T>({
  columns,
  data,
  renderRow,
  emptyMessage = "Žádná data k zobrazení",
  visibleColumnIds,
  contextMenuActions = [],
  getRowKey = (item: any) => item.id,
  columnOrder,
  onColumnOrderChange,
  onEnterAction,
  onRowClick,
  onRowDoubleClick,
}: DataTableProps<T>) {
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const visibleColumns = columns.filter((col) => visibleColumnIds.has(col.id));

  const orderedColumns = columnOrder
    ? columnOrder
        .map((id) => visibleColumns.find((col) => col.id === id))
        .filter((col): col is Column => col !== undefined)
    : visibleColumns;

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

  const handleEnterPress = useCallback(() => {
    if (data.length === 0) return;

    const focusedItem = data[focusedRowIndex];

    if (onEnterAction) {
      onEnterAction(focusedItem, focusedRowIndex);
    } else if (contextMenuActions.length > 0) {
      const rowElement = rowRefs.current[focusedRowIndex];
      if (rowElement) {
        const rect = rowElement.getBoundingClientRect();
        setContextMenu({
          mouseX: rect.left + 100,
          mouseY: rect.top + 20,
          item: focusedItem,
        });
      }
    }
  }, [data, onEnterAction, contextMenuActions.length]);

  // unified focus system - keyboard AND mouse both use this
  const { focusedRowIndex, setFocusedRowIndex, setRowRef } = useTableNavigation(
    {
      disabled: data.length === 0,
      dataLength: data.length,
      onEnterPress: handleEnterPress,
    }
  );

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedColumns.findIndex((col) => col.id === active.id);
      const newIndex = orderedColumns.findIndex((col) => col.id === over.id);

      const newOrder = arrayMove(orderedColumns, oldIndex, newIndex).map(
        (col) => col.id
      );

      if (onColumnOrderChange) {
        onColumnOrderChange(newOrder);
      }
    }
  };

  // handle mouse hover - update focus
  const handleRowMouseEnter = (index: number) => {
    setFocusedRowIndex(index);
  };

  // handle context menu - update focus and open menu
  const handleContextMenu = (event: MouseEvent, item: T, index: number) => {
    event.preventDefault();

    // set focus to the right-clicked row
    setFocusedRowIndex(index);

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

  // Store row refs for Enter key positioning
  const setRowRefWithStorage = useCallback(
    (index: number) => {
      return (el: HTMLTableRowElement | null) => {
        rowRefs.current[index] = el;
        setRowRef(index)(el);
      };
    },
    [setRowRef]
  );

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
          modifiers={[restrictToHorizontalAxis, restrictToFirstScrollableAncestor]}
        >
          <Table 
            stickyHeader
            size="small"
            sx={{
              "& .MuiTableCell-root": {
                borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                padding: "4px 8px",
                fontSize: "0.8125rem",
                lineHeight: 1.3,
                "&:last-child": {
                  borderRight: "none",
                },
              },
            }}
          >
            <TableHead >
              <TableRow
                sx={(theme) => ({
                  backgroundColor: theme.palette.grey[100],
                  "& .MuiTableCell-head": {
                    padding: "5px 5px",
                    fontWeight: 600,
                    color: theme.palette.common.black,
                    borderBottom: `2px solid ${theme.palette.primary.light}`,
                    textTransform: "none",
                    letterSpacing: "0",
                  },
                })}
              >
                <SortableContext
                  items={orderedColumns.map((col) => col.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {orderedColumns.filter((col) => !col.hidden).map((column) => (
                    <DraggableHeaderCell
                      key={column.id}
                      column={column}
                      isDragDisabled={!onColumnOrderChange}
                    />
                  ))}
                </SortableContext>
              </TableRow>
            </TableHead>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={orderedColumns.length}
                    align="center"
                    sx={{ border: "none !important" }}
                  >
                    <Typography color="text.secondary" py={4}>
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => {
                  const isFocused = index === focusedRowIndex;

                  return (
                    <TableRow
                      key={getRowKey(item)}
                      ref={setRowRefWithStorage(index)}
                      onMouseEnter={() => handleRowMouseEnter(index)}
                      onClick={() => onRowClick?.(item, index)}
                      onDoubleClick={() => onRowDoubleClick?.(item, index)}
                      onContextMenu={(e) => handleContextMenu(e, item, index)}
                      sx={{
                        cursor:
                          contextMenuActions.length > 0
                            ? "context-menu"
                            : "default",
                        backgroundColor: isFocused
                          ? "rgba(20, 184, 166, 0.15)"
                          : "transparent",
                        transition: "background-color 0.15s ease",
                        "&:hover": {
                          backgroundColor:
                            isFocused && "rgba(20, 184, 166, 0.15)",
                        },
                      }}
                    >
                      {renderRow(item, orderedColumns)}
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
        {contextMenuActions.map((action, index) => (
          <Box key={action.id}>
            <MenuItem onClick={() => handleActionClick(action)}>
              {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
            {action.divider && index < contextMenuActions.length - 1 && (
              <Divider />
            )}
          </Box>
        ))}
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCancelConfirm}>
        <DialogTitle>Potvrzení akce</DialogTitle>
        <DialogContent>
          <DialogContentText>{getConfirmMessage()}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelConfirm} color="primary">
            Zrušit
          </Button>
          <Button onClick={handleConfirmAction} color="error" autoFocus>
            Potvrdit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}