import {
  Dialog,
  Box,
  useTheme,
  Divider,
  TableCell,
} from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { useContacts } from "../../../hooks/useContacts";
import { Contact } from "../../../types/database";
import { DataTable, Column } from "../common/table/DataTable";
import ValidatedTextField from "../common/inputs/ValidatedTextField";
import { useKeyboardShortcuts } from "../../../hooks/keyboard/useKeyboardShortcuts";
import { WindowButton } from "../layout/WindowControls";
import { useAutoSearchFocus } from "../../../hooks/keyboard/useAutosearchFocus";

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
  const theme = useTheme();
  const { data: allContacts = [] } = useContacts();
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const filteredContacts = allContacts.filter((contact) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      contact.ico.startsWith(term) ||
      contact.company_name.toLowerCase().includes(term) ||
      (contact.dic && contact.dic.toUpperCase().startsWith(term.toUpperCase()))
    );
  });

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
    disabled: !open
  })

  const handleSelect = (contact: Contact) => {
    onSelect(contact);
  };

  const renderRow = (contact: Contact, visibleColumns: Column[]) => {
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
          minHeight: "80vh",
          maxHeight: "80vh",
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
        <Box sx={{ fontWeight: 600, fontSize: "1rem" }}>Vybrat kontakt</Box>

        <WindowButton
          type="close"
          onClick={onClose}
          hoverBackgroundColor={theme.palette.error.main}
        />
      </Box>

      <Divider sx={{ borderColor: theme.palette.divider }} />

      {/* Content */}
      <Box
        sx={{
          p: 2,
          bgcolor: theme.palette.background.paper,
        }}
      >
        {/* Search field */}
        <Box sx={{ mb: 2 }}>
          <ValidatedTextField
            inputRef={searchInputRef}
            label="Hledat"
            placeholder="IČO, název, DIČ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            autoFocus
          />
        </Box>

        {/* Table */}
        <Box sx={{ maxHeight: "60vh", overflow: "auto" }}>
          <DataTable
            columns={pickerColumns}
            data={filteredContacts}
            visibleColumnIds={new Set(pickerColumns.map((c) => c.id))}
            renderRow={renderRow}
            getRowKey={(contact) => `${contact.ico}-${contact.modifier}`}
            emptyMessage="Žádné kontakty nenalezeny"
            onEnterAction={handleSelect}
          />
        </Box>
      </Box>
    </Dialog>
  );
}