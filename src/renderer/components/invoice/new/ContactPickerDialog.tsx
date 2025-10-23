import { Box, TableCell, TextField } from "@mui/material";
import { useState, useRef } from "react";
import { useContacts } from "../../../../hooks/useContacts";
import { Contact } from "../../../../types/database";
import { DataTable, Column } from "../../common/table/DataTable";
import { useKeyboardShortcuts } from "../../../../hooks/keyboard/useKeyboardShortcuts";
import { useAutoSearchFocus } from "../../../../hooks/keyboard/useAutosearchFocus";
import { useTableFilters } from "../../../../hooks/useTableFilters";
import {
  contactPickerFilterConfig,
  initialPickerFilterState,
} from "../../../../config/pickerFilterConfig";
import { Dialog } from "../../common/dialog/Dialog";

interface ContactPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (contact: Contact) => void;
}

const pickerColumns: Column[] = [
  { id: "ico", label: "IČO", minWidth: 75 },
  { id: "modifier", label: "Mod", minWidth: 40, align: "center" },
  { id: "company_name", label: "Název", minWidth: 200 },
  { id: "dic", label: "DIČ", minWidth: 95 },
  { id: "price_group", label: "Skupina", minWidth: 70, align: "center" },
];

export function ContactPickerDialog({
  open,
  onClose,
  onSelect,
}: ContactPickerDialogProps) {
  const { data: allContacts = [] } = useContacts();
  const [filters, setFilters] = useState<{ search: string }>(
    initialPickerFilterState
  );
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredContacts = useTableFilters(
    allContacts,
    filters,
    contactPickerFilterConfig
  );

  const handleSelect = () => {
    if (selectedContact) {
      onSelect(selectedContact);
    }
  };

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleRowDoubleClick = (contact: Contact) => {
    onSelect(contact);
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

  const renderRow = (contact: Contact, visibleColumns: Column[]) => {
    const isSelected = selectedContact?.ico === contact.ico && 
                       selectedContact?.modifier === contact.modifier;

    return visibleColumns.map((col) => {
      let content;
      switch (col.id) {
        case "ico":
          content = contact.ico;
          break;
        case "modifier":
          content = contact.modifier;
          break;
        case "company_name":
          content = contact.company_name;
          break;
        case "dic":
          content = contact.dic || "-";
          break;
        case "price_group":
          content = `Skupina ${contact.price_group}`;
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
      title="Vybrat kontakt"
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
          disabled: !selectedContact,
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
          placeholder="IČO, název, DIČ..."
          value={filters.search || ""}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          inputRef={searchInputRef}
          fullWidth
        />
      </Box>

      <Box sx={{ maxHeight: "60vh", overflow: "auto" }}>
        <DataTable
          columns={pickerColumns}
          data={filteredContacts}
          visibleColumnIds={new Set(pickerColumns.map((c) => c.id))}
          renderRow={renderRow}
          getRowKey={(contact) => `${contact.ico}-${contact.modifier}`}
          emptyMessage="Žádné kontakty nenalezeny"
          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
          onEnterAction={handleSelect}
        />
      </Box>
    </Dialog>
  );
}