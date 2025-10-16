import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Divider,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  isPending?: boolean;
  submitLabel?: string;   // e.g., "Přidat" | "Uložit"
  cancelLabel?: string;   // e.g., "Zrušit"
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
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          // match app radius (AppLayout main uses 4px corners)
          borderRadius: 0,
          // subtle elevation similar to your main card
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        },
      }}
    >
      {/* Header bar — aligns with AppBar color */}
      <Box
        sx={{
          width: "100%",
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Box sx={{ fontWeight: 600, fontSize: "1rem" }}>{title}</Box>

        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: theme.palette.primary.contrastText,
            borderRadius: 0,
            height: 32,
            width: 32,
            "&:hover": {
              bgcolor: theme.palette.error.main,
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: theme.palette.divider }} />

      <form onSubmit={onSubmit} noValidate>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            p: 2,
            bgcolor: theme.palette.background.paper,
          }}
        >
          {children}
        </DialogContent>

        <Divider sx={{ borderColor: theme.palette.divider }} />

        <DialogActions
          sx={{
            bgcolor: theme.palette.background.default,
            py: 1.5,
            px: 1.5,
            gap: 1,
          }}
        >
          <Button
            onClick={onClose}
            color="primary"
            variant="outlined"
            size="small"
            sx={{
              minHeight: 32,
              textTransform: "none",
            }}
          >
            {cancelLabel}
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isPending}
            size="small"
            sx={{
              minHeight: 32,
              textTransform: "none",
            }}
          >
            {isPending ? "Ukládám..." : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
