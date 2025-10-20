import { TableCell, Chip, Typography, Box, Link } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useState } from "react";
import { useDeleteContact } from "../../../hooks/useContacts";
import type { Contact } from "../../../types/database";
import { DataTable, Column, ContextMenuAction } from "../common/table/DataTable";
import EditContactForm from "./EditContactForm";

interface ContactsListProps {
  contacts: Contact[];
  visibleColumnIds: Set<string>;
  columnOrder?: string[];
  onColumnOrderChange?: (newOrder: string[]) => void;
}

// All available columns - exported for use in parent
export const contactColumns: Column[] = [
  { id: "ico", label: "IČO", minWidth: 75 },
  { id: "company_name", label: "Název firmy", minWidth: 180 },
  {
    id: "modifier",
    label: "Modifikátor",
    minWidth: 30,
    maxWidth: 30,
    align: "center" as const,
    hide_label: true,
  },
  { id: "dic", label: "DIČ", minWidth: 95 },
  { id: "representative_name", label: "Kontaktní osoba", minWidth: 130 },
  { id: "city", label: "Město", minWidth: 100 },
  { id: "street", label: "Ulice", minWidth: 150 },
  { id: "postal_code", label: "PSČ", minWidth: 65 },
  { id: "phone", label: "Telefon", minWidth: 135 },
  { id: "email", label: "E-mail", minWidth: 180 },
  { id: "website", label: "Web", minWidth: 150 },
  { id: "type", label: "Typ", minWidth: 53, maxWidth: 106, align: "center" as const   },
  {
    id: "price_group",
    label: "Cenová skupina",
    minWidth: 80,
    align: "center" as const,
  },
  { id: "bank_account", label: "Bankovní účet", minWidth: 100 },
];

function ContactsList({
  contacts,
  visibleColumnIds,
  columnOrder,
  onColumnOrderChange,
}: ContactsListProps) {
  const deleteContact = useDeleteContact();
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const handleDelete = async (contact: Contact) => {
    try {
      await deleteContact.mutateAsync({
        ico: contact.ico,
        modifier: contact.modifier,
      });
    } catch (error) {
      console.error("Chyba při mazání kontaktu:", error);
      alert("Chyba: " + (error as Error).message);
    }
  };

  // Define context menu actions
  const contextMenuActions: ContextMenuAction<Contact>[] = [
    {
      id: "edit",
      label: "Upravit",
      icon: <EditIcon fontSize="small" />,
      onClick: (contact) => setEditingContact(contact),
    },
    {
      id: "delete",
      label: "Smazat",
      icon: <DeleteIcon fontSize="small" />,
      onClick: handleDelete,
      requireConfirm: true,
      confirmMessage: (contact) =>
        `Opravdu chcete smazat kontakt "${contact.company_name}"?`,
      divider: true,
    },
  ];

  // Render cell content based on column id
  const getCellContent = (contact: Contact, columnId: string) => {
    switch (columnId) {
      case "ico":
        return contact.ico;

      case "company_name":
        return (
          <Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, lineHeight: 1.4 }}
            >
              {contact.company_name}
            </Typography>
          </Box>
        );

      case "modifier":
        return contact.modifier;

      case "dic":
        return contact.dic || "-";

      case "representative_name":
        return contact.representative_name || "-";

      case "city":
        return contact.city || "-";

      case "street":
        return contact.street || "-";

      case "postal_code":
        return contact.postal_code || "-";

      case "phone":
        return contact.phone || "-";

      case "email":
        return contact.email ? (
          <Link
            href={`mailto:${contact.email}`}
            sx={{
              textDecoration: "none",
              fontSize: "0.875rem",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {contact.email}
          </Link>
        ) : (
          "-"
        );

      case "website":
        return contact.website ? (
          <Link
            sx={{
              textDecoration: "none",
              fontSize: "0.875rem",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {contact.website}
          </Link>
        ) : (
          "-"
        );

      case "type":
        return (
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {!!contact.is_customer && (
              <Chip
                label="Odběratel"
                size="small"
                color="primary"
                sx={{ height: 22 }}
              />
            )}
            {!!contact.is_supplier && (
              <Chip
                label="Dodavatel"
                size="small"
                color="secondary"
                sx={{ height: 22 }}
              />
            )}
            {!contact.is_customer && !contact.is_supplier && "-"}
          </Box>
        );

      case "price_group":
        return `Skupina ${contact.price_group}`;

      case "bank_account":
        return contact.bank_account || "-";

      default:
        return "-";
    }
  };

  return (
    <>
      <DataTable
        columns={contactColumns}
        data={contacts}
        visibleColumnIds={visibleColumnIds}
        emptyMessage='Žádné kontakty. Klikněte na "Přidat kontakt" pro vytvoření nového.'
        contextMenuActions={contextMenuActions}
        getRowKey={(contact) => `${contact.ico}-${contact.modifier}`}
        columnOrder={columnOrder}
        onColumnOrderChange={onColumnOrderChange}
        renderRow={(contact, visibleColumns) => (
          <>
            {visibleColumns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align}
                style={{
                  maxWidth: column.maxWidth,
                  minWidth: column.minWidth,
                  width: column.width,
                }}
              >
                {getCellContent(contact, column.id)}
              </TableCell>
            ))}
          </>
        )}
      />

      {editingContact && (
        <EditContactForm
          open={!!editingContact}
          onClose={() => setEditingContact(null)}
          contact={editingContact}
        />
      )}
    </>
  );
}

export default ContactsList;
