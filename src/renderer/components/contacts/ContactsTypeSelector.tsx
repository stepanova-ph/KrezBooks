import * as React from "react";
import { Box, Chip, Grid, Tooltip } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { CONTACT_TYPES } from "../../../config/constants";

type Props = {
	isCustomer: boolean;
	isSupplier: boolean;
	onChange: (next: { is_customer: boolean; is_supplier: boolean }) => void;
	disabled?: boolean;
	errorText?: string;
	small?: boolean;
};

const inactiveAlpha = 0.15;

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

	const primaryInactiveSx = {
		backgroundColor: alpha(theme.palette.primary.light, inactiveAlpha),
		border: `1px solid ${alpha(theme.palette.primary.main, inactiveAlpha + 0.15)}`,
		color: theme.palette.text.secondary,
	};

	const secondaryInactiveSx = {
		backgroundColor: alpha(theme.palette.secondary.light, inactiveAlpha),
		border: `1px solid ${alpha(theme.palette.secondary.main, inactiveAlpha + 0.15)}`,
		color: theme.palette.text.secondary,
	};

	const handleToggleCustomer = () =>
		onChange({ is_customer: !isCustomer, is_supplier: isSupplier });

	const handleToggleSupplier = () =>
		onChange({ is_customer: isCustomer, is_supplier: !isSupplier });

	const handleKeyDown = (
		e: React.KeyboardEvent,
		type: "customer" | "supplier",
	) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (type === "customer") {
				handleToggleCustomer();
			} else {
				handleToggleSupplier();
			}
		}
	};

	return (
		<Grid
			item
			sx={{ display: "flex", justifyContent: "center", gap: 2, mr: -5 }}
		>
			<Chip
				label={CONTACT_TYPES.customer.label}
				size={small ? "small" : "medium"}
				clickable={!disabled}
				onClick={disabled ? undefined : handleToggleCustomer}
				onKeyDown={(e) => !disabled && handleKeyDown(e, "customer")}
				tabIndex={disabled ? -1 : 0} // make it keyboard-focusable
				sx={{
					...commonChipSx,
					...(disabled
						? disabledChipSx
						: isCustomer
							? primaryActiveSx
							: primaryInactiveSx),
				}}
			/>

			<Chip
				label={CONTACT_TYPES.supplier.label}
				size={small ? "small" : "medium"}
				clickable={!disabled}
				onClick={disabled ? undefined : handleToggleSupplier}
				onKeyDown={(e) => !disabled && handleKeyDown(e, "supplier")}
				tabIndex={disabled ? -1 : 0} // make it keyboard-focusable
				sx={{
					...commonChipSx,
					...(disabled
						? disabledChipSx
						: isSupplier
							? secondaryActiveSx
							: secondaryInactiveSx),
				}}
			/>
		</Grid>
	);
}

export default ContactTypeSelector;
