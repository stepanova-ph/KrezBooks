import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

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
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxWidth: 600,
          width: "100%",
          borderRadius: 0, // No rounded corners like main window
        },
      }}
    >
      {/* Blue header matching AppBar */}
      <Box
        sx={{
          width: "100%",
          height: 48,
          backgroundColor: "#00556B", // Same as AppBar
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            color: "#FFF",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          {title}
        </Box>

        {/* Close button - copied from WindowControls */}
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: "#FFF",
            borderRadius: 0,
            height: 32,
            width: 32,
            "&:hover": {
              backgroundColor: (theme) => theme.palette.error.main,
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <form onSubmit={onSubmit} noValidate>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2 }}
        >
          {children}
        </DialogContent>
        <DialogActions sx={{ padding: "12px 20px", gap: 1 }}>
          <Button onClick={onClose} color="inherit">
            {cancelLabel}
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? "Ukládám..." : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}