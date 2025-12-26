import { useUpdateItem } from "../../../hooks/useItems";
import type { Item, CreateItemInput } from "../../../types/database";
import ItemForm from "./ItemForm";

interface EditItemFormProps {
	open: boolean;
	onClose: () => void;
	item: Item;
}

function EditItemForm({ open, onClose, item }: EditItemFormProps) {
	const updateItem = useUpdateItem();

	const handleSubmit = async (data: CreateItemInput) => {
		try {
			// Remove stock_amount as it's calculated from stock movements, not editable
			const { stock_amount, ...updateData } = data as any;
			await updateItem.mutateAsync({
				ean: item.ean,
				...updateData,
			});
			onClose();
		} catch (error) {
			console.error("Chyba při úpravě položky:", error);
			throw error;
		}
	};

	return (
		<ItemForm
			open={open}
			onClose={onClose}
			onSubmit={handleSubmit}
			initialData={item}
			mode="edit"
			isPending={updateItem.isPending}
		/>
	);
}

export default EditItemForm;
