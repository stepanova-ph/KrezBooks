import { Box, Typography, useTheme, Button } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useKeyboardShortcuts } from "../../../../hooks/keyboard/useKeyboardShortcuts";
import { Dialog } from "./Dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "warning" | "danger" | "info";
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Potvrdit",
  cancelLabel = "Zrušit",
  onConfirm,
  onCancel,
  variant = "warning",
}: ConfirmDialogProps) {
  const theme = useTheme();

  const colorMap = {
    warning: theme.palette.warning.main,
    danger: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const color = colorMap[variant];

  useKeyboardShortcuts(
    {
      Enter: onConfirm,
      Escape: onCancel,
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
      onClose={onCancel}
      title={title}
      maxWidth="xs"
      actions={[
        {
          label: cancelLabel,
          onClick: onCancel,
          variant: "outlined",
        },
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
        <WarningAmberIcon
          sx={{
            fontSize: 48,
            color,
          }}
        />
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Dialog>
  );
}