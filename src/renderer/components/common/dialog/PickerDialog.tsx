import { Box, TextField } from "@mui/material";
import { useState, useRef, ReactNode, useCallback } from "react";
import { Dialog } from "./Dialog";
import { DataTable, Column } from "../table/DataTable";
import { useKeyboardShortcuts } from "../../../../hooks/keyboard/useKeyboardShortcuts";
import { useAutoSearchFocus } from "../../../../hooks/keyboard/useAutosearchFocus";

interface PickerDialogProps<T> {
  open: boolean;
  onClose: () => void;
  onSelect: (item: T) => void;
  title: string;
  columns: Column[];
  data: T[];
  getRowKey: (item: T) => string | number;
  renderRow: (item: T, visibleColumns: Column[], isFocused: boolean) => ReactNode;
  emptyMessage?: string;
  searchPlaceholder?: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
}

export function PickerDialog<T>({
  open,
  onClose,
  onSelect,
  title,
  columns,
  data,
  getRowKey,
  renderRow,
  emptyMessage = "Žádné položky nenalezeny",
  searchPlaceholder = "Hledat...",
  filterValue,
  onFilterChange,
}: PickerDialogProps<T>) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [focusedItem, setFocusedItem] = useState<T | null>(null);

  const handleSelect = useCallback(() => {
    if (focusedItem) {
      onSelect(focusedItem);
    }
  }, [focusedItem, onSelect]);

  const handleEnterAction = useCallback((item: T) => {
    onSelect(item);
  }, [onSelect]);

  const handleDoubleClick = useCallback((item: T) => {
    onSelect(item);
  }, [onSelect]);

  const handleFocusChange = useCallback((item: T | null) => {
    setFocusedItem(item);
  }, []);

  useKeyboardShortcuts(
    {
      Escape: onClose,
    },
    {
      disabled: !open,
      preventInInputs: false,
    }
  );

  useAutoSearchFocus({
    inputRef: searchInputRef,
    disabled: !open,
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="md"
      actions={[
        {
          label: "Zrušit",
          onClick: onClose,
          variant: "outlined",
        },
        {
          label: "Vybrat",
          onClick: handleSelect,
          variant: "contained",
          disabled: !focusedItem,
        },
      ]}
    >
      <Box
        sx={{
          p: 2,
          bgcolor: (theme) => theme.palette.background.default,
          borderRadius: 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          mb: 2,
        }}
      >
        <TextField
          size="small"
          label="Hledat"
          placeholder={searchPlaceholder}
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          inputRef={searchInputRef}
          fullWidth
        />
      </Box>

      <Box sx={{ maxHeight: "60vh", overflow: "auto" }}>
        <DataTable
          columns={columns}
          data={data}
          visibleColumnIds={new Set(columns.map((c) => c.id))}
          renderRow={renderRow}
          getRowKey={getRowKey}
          emptyMessage={emptyMessage}
          onFocusChange={handleFocusChange}
          onRowDoubleClick={handleDoubleClick}
          onEnterAction={handleEnterAction}
        />
      </Box>
    </Dialog>
  );
}