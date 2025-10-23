import React from "react";
import {
  Dialog as MuiDialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Divider,
  useTheme,
} from "@mui/material";
import { WindowButton } from "../../layout/WindowControls";

interface DialogAction {
  label: string;
  onClick: () => void;
  variant?: "text" | "outlined" | "contained";
  color?: "primary" | "secondary" | "error";
  disabled?: boolean;
  type?: "button" | "submit";
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: DialogAction[];
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  onSubmit?: () => void; // ADD THIS - for Enter key handling
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = "sm",
  fullWidth = true,
  onSubmit,
}: DialogProps) {
  const theme = useTheme();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSubmit && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      onKeyDown={handleKeyDown}
      PaperProps={{
        sx: {
          borderRadius: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        },
      }}
      disablePortal={false}
      style={{ zIndex: 1300 }} // Base dialogs at 1300
    >
      <Box
        sx={{
          width: "100%",
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pl: 2,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Box sx={{ fontWeight: 600, fontSize: "1rem" }}>{title}</Box>
        <WindowButton
          type="close"
          onClick={onClose}
          hoverBackgroundColor={theme.palette.error.main}
        />
      </Box>

      <Divider sx={{ borderColor: theme.palette.divider }} />

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

      {actions && actions.length > 0 && (
        <>
          <Divider sx={{ borderColor: theme.palette.divider }} />
          <DialogActions
            sx={{
              bgcolor: theme.palette.background.default,
              py: 1.5,
              px: 1.5,
              gap: 1,
            }}
          >
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || "outlined"}
                color={action.color || "primary"}
                disabled={action.disabled}
                type={action.type}
                size="small"
                sx={{
                  minHeight: 32,
                  textTransform: "none",
                }}
              >
                {action.label}
              </Button>
            ))}
          </DialogActions>
        </>
      )}
    </MuiDialog>
  );
}