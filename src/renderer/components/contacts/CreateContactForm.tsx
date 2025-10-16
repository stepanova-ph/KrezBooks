import { useCreateContact } from '../../../hooks/useContacts';
import ContactForm from './ContactForm';

function CreateContactForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createContact = useCreateContact();

  const handleSubmit = async (data: any) => {
    await createContact.mutateAsync(data);
  };

  return (
    <ContactForm
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      mode="create"
      isPending={createContact.isPending}
    />
  );
}

export default CreateContactForm;