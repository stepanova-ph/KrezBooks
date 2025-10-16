import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

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
  submitLabel = 'Uložit',
  cancelLabel = 'Zrušit',
}: FormDialogProps) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          maxWidth:600,
          width: '100%',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
      <form onSubmit={onSubmit} noValidate>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2 }}>
          {children}
        </DialogContent>
        <DialogActions sx={{ padding: '12px 20px', gap: 1 }}>
          <Button onClick={onClose} color="inherit">
            {cancelLabel}
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? 'Ukládám...' : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}