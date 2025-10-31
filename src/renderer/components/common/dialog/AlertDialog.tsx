import { Box, Typography } from "@mui/material";
import { useKeyboardShortcuts } from "../../../../hooks/keyboard/useKeyboardShortcuts";
import { Dialog } from "./Dialog";

interface AlertDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export function AlertDialog({
  open,
  title,
  message,
  confirmLabel = "OK",
  onConfirm,
}: AlertDialogProps) {

  useKeyboardShortcuts(
    {
      Enter: onConfirm,
      Escape: onConfirm,
    },
    {
      disabled: !open,
      preventInInputs: false,
    }
  );

  return (
    <Dialog
      noCloseButton
      open={open}
      onClose={onConfirm}
      title={title}
      maxWidth="xs"
      actions={[
        {
          label: confirmLabel,
          onClick: onConfirm,
          variant: "contained",
        },
      ]}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          textAlign: "center",
          py: 2,
        }}
      >
        <Typography variant="body1" color="text.primary">
          {message}
        </Typography>
      </Box>
    </Dialog>
  );
}