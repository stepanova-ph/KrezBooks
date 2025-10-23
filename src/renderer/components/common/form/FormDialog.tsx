import React from "react";
import { Dialog } from "../dialog/Dialog";

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  isPending?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

export function FormDialog({
  open,
  onClose,
  title,
  children,
  onSubmit,
  isPending = false,
  submitLabel = "Uložit",
  cancelLabel = "Zrušit",
}: FormDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      actions={[
        {
          label: cancelLabel,
          onClick: onClose,
          variant: "outlined",
        },
        {
          label: isPending ? "Ukládám..." : submitLabel,
          onClick: handleSubmit,
          variant: "contained",
          disabled: isPending,
        },
      ]}
    >
      <form onSubmit={handleSubmit} noValidate>
        {children}
      </form>
    </Dialog>
  );
}