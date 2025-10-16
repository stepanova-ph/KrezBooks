import { useCreateItem } from '../../../hooks/useItems';
import ItemForm from './ItemForm';
import type { CreateItemInput } from '../../../types/database';

function CreateItemForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createItem = useCreateItem();

  const handleSubmit = async (data: CreateItemInput) => {
    try {
      await createItem.mutateAsync(data);
      onClose(); // Only close on success
    } catch (error) {
      console.error('Chyba při vytváření položky:', error);
      throw error;
    }
  };

  return (
    <ItemForm
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      mode="create"
      isPending={createItem.isPending}
    />
  );
}

export default CreateItemForm;