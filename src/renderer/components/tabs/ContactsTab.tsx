import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useContacts } from "../../../hooks/useContacts";
import ContactsList, { contactColumns } from "../contacts/ContactsList";
import CreateContactForm from "../contacts/CreateContactForm";
import {
  contactFilterConfig,
  initialContactFilterState,
  defaultVisibleColumnsContact,
} from "../../../config/contactFilterConfig";
import { ListTabComponent } from "../common/ListTabComponent";

function ContactsTab() {
  const { data: contacts = [], isLoading } = useContacts();

  return (
    <ListTabComponent
      data={contacts}
      isLoading={isLoading}
      loadingText="Načítám adresář..."
      filterConfig={contactFilterConfig}
      initialFilterState={initialContactFilterState}
      defaultVisibleColumns={defaultVisibleColumnsContact}
      columns={contactColumns}
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
      renderList={({ data, visibleColumnIds, columnOrder, onColumnOrderChange, orderBy }) => (
        <ContactsList
          contacts={data}
          visibleColumnIds={visibleColumnIds}
          columnOrder={columnOrder}
          onColumnOrderChange={onColumnOrderChange}
          orderBy={orderBy}
        />
      )}
    />
  );
}

export default ContactsTab;
