import * as React from "react";
import { Box, Chip, Tooltip } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useTheme, alpha } from "@mui/material/styles";
import { CONTACT_TYPE } from "../../../config/constants";

type Props = {
  isCustomer: boolean;
  isSupplier: boolean;
  onChange: (next: { is_customer: boolean; is_supplier: boolean }) => void;
  disabled?: boolean;
  errorText?: string;
  small?: boolean;
};

export function ContactTypeSelector({
  isCustomer,
  isSupplier,
  onChange,
  disabled = false,
  errorText,
  small = true,
}: Props) {
  const theme = useTheme();

  const commonChipSx = {
    height: small ? 22 : 28,
    fontSize: small ? "0.75rem" : "0.8125rem",
    borderRadius: 999,
  };

  const disabledChipSx = {
    backgroundColor: alpha(theme.palette.action.hover, 0.85),
    color: theme.palette.text.disabled,
    borderColor: theme.palette.divider,
  };

  const primaryActiveSx = {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  };

  const secondaryActiveSx = {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
  };

  const inactiveSx = {
    backgroundColor: alpha(theme.palette.background.paper, 0.0),
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
  };

  const handleToggleCustomer = () =>
    onChange({ is_customer: !isCustomer, is_supplier: isSupplier });

  const handleToggleSupplier = () =>
    onChange({ is_customer: isCustomer, is_supplier: !isSupplier });

  return (
    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
      <Chip
        label={CONTACT_TYPE.customer}
        size={small ? "small" : "medium"}
        clickable={!disabled}
        onClick={disabled ? undefined : handleToggleCustomer}
        sx={{
          ...commonChipSx,
          ...(disabled
            ? disabledChipSx
            : isCustomer
            ? primaryActiveSx
            : inactiveSx),
        }}
      />

      <Chip
        label={CONTACT_TYPE.supplier}
        size={small ? "small" : "medium"}
        clickable={!disabled}
        onClick={disabled ? undefined : handleToggleSupplier}
        sx={{
          ...commonChipSx,
          ...(disabled
            ? disabledChipSx
            : isSupplier
            ? secondaryActiveSx
            : inactiveSx),
        }}
      />

      {errorText && (
        <Tooltip title={errorText} arrow>
          <ErrorOutlineIcon
            sx={{ color: "error.main", fontSize: 20, cursor: "help", ml: 0.5 }}
          />
        </Tooltip>
      )}
    </Box>
  );
}

export default ContactTypeSelector;
