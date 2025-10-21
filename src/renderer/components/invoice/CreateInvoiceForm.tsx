import { InvoiceForm } from "./InvoiceForm";
import type { CreateInvoiceInput } from "../../../types/database";

interface CreateInvoiceFormProps {
  open: boolean;
  onClose: () => void;
}

export function CreateInvoiceForm({ open, onClose }: CreateInvoiceFormProps) {
  const handleSubmit = async (data: CreateInvoiceInput) => {
    try {
      // TODO: Implement invoice creation via IPC
      console.log("Vytváření dokladu:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      onClose();
    } catch (error) {
      console.error("Chyba při vytváření dokladu:", error);
      throw error;
    }
  };

  return (
    <InvoiceForm
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      mode="create"
      isPending={false}
    />
  );
}