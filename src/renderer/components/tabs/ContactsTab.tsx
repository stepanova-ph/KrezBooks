import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { FilterBar } from "../common/FilterBar";
import { useTableFilters } from "../../../hooks/useTableFilters";
import {
  contactFilterConfig,
  initialContactFilterState,
  defaultVisibleColumnsContact,
} from "../../../config/contactFilterConfig";
import type { ContactFilterState } from "../../../types/filter";
import ContactsList, { contactColumns } from "../contacts/ContactsList";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useContacts } from "../../../hooks/useContacts";
import CreateContactForm from "../contacts/CreateContactForm";
import { useColumnVisibility } from "../../../hooks/useColumnVisibility";

function ContactTab() {
  const { data: contacts = [], isLoading } = useContacts();
  
  const [filters, setFilters] = useState<ContactFilterState>(
    initialContactFilterState,
  );

  const { 
    visibleColumnIds, 
    columnOrder, 
    handleVisibleColumnsChange, 
    setColumnOrder 
  } = useColumnVisibility(defaultVisibleColumnsContact);

  const filteredContacts = useTableFilters(contacts, filters);

  if (isLoading) {
    return <Typography>Načítání...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <FilterBar
        config={contactFilterConfig}
        filters={filters}
        onFiltersChange={setFilters}
        columns={contactColumns}
        visibleColumnIds={visibleColumnIds}
        onVisibleColumnsChange={handleVisibleColumnsChange}
        defaultColumnIds={defaultVisibleColumnsContact}
        actions={[
          {
            id: "add-contact",
            label: "Přidat kontakt",
            startIcon: <PersonAddIcon />,
            renderDialog: ({ open, onClose }) => (
              <CreateContactForm open={open} onClose={onClose} />
            ),
          },
        ]}
      />

      {/* Data Table */}
      <ContactsList
        contacts={filteredContacts}
        visibleColumnIds={visibleColumnIds}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
      />
    </Box>
  );
}

export default ContactTab;