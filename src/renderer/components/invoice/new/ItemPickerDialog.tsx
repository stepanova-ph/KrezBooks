import { Box, TableCell } from "@mui/material";
import { useState, useRef } from "react";
import { useItems } from "../../../../hooks/useItems";
import { Item } from "../../../../types/database";
import { DataTable, Column } from "../../common/table/DataTable";
import ValidatedTextField from "../../common/inputs/ValidatedTextField";
import { useKeyboardShortcuts } from "../../../../hooks/keyboard/useKeyboardShortcuts";
import { useAutoSearchFocus } from "../../../../hooks/keyboard/useAutosearchFocus";
import { formatVatRateShort } from "../../../../utils/formattingUtils";
import { useTableFilters } from "../../../../hooks/useTableFilters";
import {
  initialPickerFilterState,
  itemPickerFilterConfig,
} from "../../../../config/pickerFilterConfig";
import { Dialog } from "../../common/dialog/Dialog";

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
  const { data: allItems = [] } = useItems();
  const [filters, setFilters] = useState<{ search: string }>(
    initialPickerFilterState
  );
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useTableFilters(
    allItems,
    filters,
    itemPickerFilterConfig
  );

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
    }
  };

  const handleRowClick = (item: Item) => {
    setSelectedItem(item);
  };

  const handleRowDoubleClick = (item: Item) => {
    onSelect(item);
  };

  useKeyboardShortcuts(
    {
      Escape: onClose,
      Enter: handleSelect,
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

  const renderRow = (item: Item, visibleColumns: Column[]) => {
    const isSelected = selectedItem?.ean === item.ean;

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
        <TableCell
          key={col.id}
          align={col.align}
          sx={{
            bgcolor: isSelected ? "action.selected" : "inherit",
          }}
        >
          {content}
        </TableCell>
      );
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Vybrat položku"
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
          disabled: !selectedItem,
        },
      ]}
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
          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
          onEnterAction={handleSelect}
        />
      </Box>
    </Dialog>
  );
}