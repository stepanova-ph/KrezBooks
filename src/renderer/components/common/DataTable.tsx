import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Checkbox,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  CircularProgress,
} from '@mui/material';
import { useState, MouseEvent } from 'react';

export interface Column<TData = any> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row: TData) => React.ReactNode;
  sortable?: boolean;
}

export interface ContextMenuAction<TData = any> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (row: TData) => void;
  divider?: boolean;
  disabled?: (row: TData) => boolean;
}

export interface DataTableProps<TData = any> {
  columns: Column<TData>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  selectable?: boolean;
  selectedRows?: Set<any>;
  onSelectionChange?: (selected: Set<any>) => void;
  getRowId?: (row: TData) => any;
  contextMenuActions?: ContextMenuAction<TData>[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<TData = any>({
  columns,
  data,
  onRowClick,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  getRowId = (row: any) => row.id,
  contextMenuActions = [],
  sortColumn,
  sortDirection = 'asc',
  onSort,
  loading = false,
  emptyMessage = 'Žádná data',
}: DataTableProps<TData>) {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    row: TData;
  } | null>(null);

  const handleContextMenu = (event: MouseEvent<HTMLTableRowElement>, row: TData) => {
    if (contextMenuActions.length === 0) return;
    
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            row,
          }
        : null
    );
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuAction = (action: ContextMenuAction<TData>) => {
    if (contextMenu) {
      action.onClick(contextMenu.row);
      handleContextMenuClose();
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = new Set(data.map((row) => getRowId(row)));
      onSelectionChange?.(newSelected);
    } else {
      onSelectionChange?.(new Set());
    }
  };

  const handleSelectRow = (event: React.MouseEvent, rowId: any) => {
    event.stopPropagation();
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    onSelectionChange?.(newSelected);
  };

  const handleSortClick = (columnId: string) => {
    if (onSort) {
      onSort(columnId);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Box color="text.secondary">{emptyMessage}</Box>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedRows.size > 0 && selectedRows.size < data.length
                    }
                    checked={data.length > 0 && selectedRows.size === data.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.sortable !== false && onSort ? (
                    <TableSortLabel
                      active={sortColumn === column.id}
                      direction={sortColumn === column.id ? sortDirection : 'asc'}
                      onClick={() => handleSortClick(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => {
              const rowId = getRowId(row);
              const isSelected = selectedRows.has(rowId);

              return (
                <TableRow
                  hover
                  key={rowId}
                  selected={isSelected}
                  onClick={() => onRowClick?.(row)}
                  onContextMenu={(e) => handleContextMenu(e, row)}
                  sx={{
                    cursor: onRowClick || contextMenuActions.length > 0 ? 'pointer' : 'default',
                  }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onClick={(e) => handleSelectRow(e, rowId)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => {
                    const value = (row as any)[column.id];
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {column.format ? column.format(value, row) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {contextMenuActions.map((action, index) => {
          const isDisabled = contextMenu && action.disabled
            ? action.disabled(contextMenu.row)
            : false;

          return (
            <MenuItem
              key={action.id}
              onClick={() => handleContextMenuAction(action)}
              disabled={isDisabled}
              divider={action.divider}
            >
              {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}