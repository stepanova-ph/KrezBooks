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

function ContactTab() {
  const { data: contacts = [], isLoading } = useContacts();
  const [filters, setFilters] = useState<ContactFilterState>(
    initialContactFilterState,
  );

  const [visibleColumnIds, setVisibleColumnIds] = useState<Set<string>>(
    new Set(defaultVisibleColumnsContact),
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    defaultVisibleColumnsContact,
  );

  // Handler that syncs both visibleColumnIds and columnOrder
  const handleVisibleColumnsChange = (newVisibleColumnIds: Set<string>) => {
    setVisibleColumnIds(newVisibleColumnIds);

    // Update column order to match the new visible columns
    // Keep existing order for columns that are still visible,
    // and add newly visible columns at the end
    const newVisibleArray = Array.from(newVisibleColumnIds);
    const orderedVisible = columnOrder.filter((id) =>
      newVisibleColumnIds.has(id),
    );
    const newColumns = newVisibleArray.filter(
      (id) => !columnOrder.includes(id),
    );

    setColumnOrder([...orderedVisible, ...newColumns]);
  };

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
