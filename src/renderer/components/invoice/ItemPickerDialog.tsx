import {
  Dialog,
  Box,
  useTheme,
  Divider,
  TableCell,
} from "@mui/material";
import { useState, useRef } from "react";
import { useItems } from "../../../hooks/useItems";
import { Item } from "../../../types/database";
import { DataTable, Column } from "../common/table/DataTable";
import ValidatedTextField from "../common/inputs/ValidatedTextField";
import { useKeyboardShortcuts } from "../../../hooks/keyboard/useKeyboardShortcuts";
import { WindowButton } from "../layout/WindowControls";
import { useAutoSearchFocus } from "../../../hooks/keyboard/useAutosearchFocus";
import { formatVatRateShort } from "../../../utils/formattingUtils";
import { useTableFilters } from "../../../hooks/useTableFilters";
import { initialPickerFilterState, itemPickerFilterConfig } from "../../../config/pickerFilterConfig";

interface ItemPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: Item) => void;
}

const pickerColumns: Column[] = [
  { id: "ean", label: "EAN", minWidth: 100 },
  { id: "name", label: "Název", minWidth: 200 },
  { id: "category", label: "Kategorie", minWidth: 100 },
  { id: "unit_of_measure", label: "Jednotka", minWidth: 80, align: "center" },
  { id: "vat_rate", label: "DPH", minWidth: 60, align: "center" },
];

export function ItemPickerDialog({
  open,
  onClose,
  onSelect,
}: ItemPickerDialogProps) {
  const theme = useTheme();
  const { data: allItems = [] } = useItems();
  const [filters, setFilters] = useState<{search: string}>(
    initialPickerFilterState
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useTableFilters(
    allItems,
    filters,
    itemPickerFilterConfig
  );

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

  const handleSelect = (item: Item) => {
    onSelect(item);
  };

  const renderRow = (item: Item, visibleColumns: Column[]) => {
    return visibleColumns.map((col) => {
      let content;
      switch (col.id) {
        case "ean":
          content = item.ean;
          break;
        case "name":
          content = item.name;
          break;
        case "category":
          content = item.category || "-";
          break;
        case "unit_of_measure":
          content = item.unit_of_measure;
          break;
        case "vat_rate":
          content = formatVatRateShort(item.vat_rate);
          break;
        default:
          content = "-";
      }

      return (
        <TableCell key={col.id} align={col.align}>
          {content}
        </TableCell>
      );
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        },
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          width: "100%",
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pl: 2,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Box sx={{ fontWeight: 600, fontSize: "1rem" }}>Vybrat položku</Box>

        <WindowButton
          type="close"
          onClick={onClose}
          hoverBackgroundColor={theme.palette.error.main}
        />
      </Box>

      <Divider sx={{ borderColor: theme.palette.divider }} />

      <Box
        sx={{
          p: 2,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <ValidatedTextField
            inputRef={searchInputRef}
            label="Hledat"
            placeholder="EAN, název, kategorie..."
            value={filters.search || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            fullWidth
            autoFocus
          />
        </Box>

        <Box sx={{ maxHeight: "60vh", overflow: "auto" }}>
          <DataTable
            columns={pickerColumns}
            data={filteredItems}
            visibleColumnIds={new Set(pickerColumns.map((c) => c.id))}
            renderRow={renderRow}
            getRowKey={(item) => item.ean}
            emptyMessage="Žádné položky nenalezeny"
            onEnterAction={handleSelect}
          />
        </Box>
      </Box>
    </Dialog>
  );
}