import { useState, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { FilterBar, FilterBarRef } from "../common/filtering/FilterBar";
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
import { useAutoSearchFocus } from "../../../hooks/keyboard/useAutosearchFocus";
import { Loading } from "../layout/Loading";

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

  const filterBarRef = useRef<FilterBarRef>(null);

  useAutoSearchFocus({
    filterBarRef: filterBarRef,
    disabled: false,
  });

  const filteredContacts = useTableFilters(contacts, filters, contactFilterConfig);

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100%',
          height: '100%'
        }}
      >
        <Loading size="large" text="Načítám adresář..." />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <FilterBar
        ref={filterBarRef}
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