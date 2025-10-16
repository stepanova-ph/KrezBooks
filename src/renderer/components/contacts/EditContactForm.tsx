import { useUpdateContact } from '../../../hooks/useContacts';
import type { Contact, CreateContactInput } from '../../../types/database';
import ContactForm from './ContactForm';

interface EditContactFormProps {
  open: boolean;
  onClose: () => void;
  contact: Contact;
}

function EditContactForm({ open, onClose, contact }: EditContactFormProps) {
  const updateContact = useUpdateContact();

  const handleSubmit = async (data: CreateContactInput) => {
    try {
      await updateContact.mutateAsync({
        ...data,
      });
      onClose(); // Only close on success
    } catch (error) {
      console.error('Chyba při úpravě kontaktu:', error);
      // Re-throw so ContactForm can handle it
      throw error;
    }
  };

  return (
    <ContactForm
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      initialData={contact}
      mode="edit"
      isPending={updateContact.isPending}
    />
  );
}

export default EditContactForm;