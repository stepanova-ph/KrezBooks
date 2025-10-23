import {
  Dialog,
  Box,
  useTheme,
  Divider,
  TableCell,
  TextField,
} from "@mui/material";
import { useState, useRef } from "react";
import { useContacts } from "../../../../hooks/useContacts";
import { Contact } from "../../../../types/database";
import { DataTable, Column } from "../../common/table/DataTable";
import { useKeyboardShortcuts } from "../../../../hooks/keyboard/useKeyboardShortcuts";
import { WindowButton } from "../../layout/WindowControls";
import { useAutoSearchFocus } from "../../../../hooks/keyboard/useAutosearchFocus";
import { useTableFilters } from "../../../../hooks/useTableFilters";
import { 
  contactPickerFilterConfig,
  initialPickerFilterState 
} from "../../../../config/pickerFilterConfig";

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
  const [filters, setFilters] = useState<{search: string}>(
    initialPickerFilterState
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const filteredContacts = useTableFilters(
    allContacts, 
    filters, 
    contactPickerFilterConfig
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
    disabled: !open
  });

  const handleSelect = (contact: Contact) => {
    onSelect(contact);
    console.log(`handleselect z dialogu contact: ${JSON.stringify(contact)}`);
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
        {/* Simple filter box matching FilterBar style */}
        <Box
          sx={{
            p: 2,
            bgcolor: theme.palette.background.default,
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