import { useState, useEffect } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { Dialog } from "../common/dialog/Dialog";
import { validationMessages } from "../../../config/validationMessages";

const PRESET_DISCOUNTS = ["10", "20", "30", "50", "70", "90"];

interface DiscountDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (discount: number | null) => void;
	initialDiscount: number | null;
}

export function DiscountDialog({
	open,
	onClose,
	onConfirm,
	initialDiscount,
}: DiscountDialogProps) {
	const [value, setValue] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (open) {
			setValue(initialDiscount != null ? String(initialDiscount) : "");
			setError("");
		}
	}, [open, initialDiscount]);

	const handleConfirm = () => {
		const trimmed = value.trim().replace("%", "").trim();

		// Empty input (or 0) removes the discount
		if (trimmed === "" || trimmed === "0") {
			onConfirm(null);
			onClose();
			return;
		}

		const num = Number(trimmed);
		if (!Number.isInteger(num) || num < 1 || num > 100) {
			setError(validationMessages.invoice.discount.invalid);
			return;
		}

		onConfirm(num);
		onClose();
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title="Sleva"
			maxWidth="xs"
			onSubmit={handleConfirm}
			actions={[
				{
					label: "Zrušit",
					onClick: onClose,
					variant: "outlined",
				},
				{
					label: "Potvrdit",
					onClick: handleConfirm,
					variant: "contained",
				},
			]}
		>
			<Autocomplete
				freeSolo
				forcePopupIcon
				options={PRESET_DISCOUNTS}
				inputValue={value}
				onInputChange={(_, newValue) => {
					setValue(newValue);
					setError("");
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						autoFocus
						label="Sleva (%)"
						error={!!error}
						helperText={error || "Prázdné pole slevu odebere"}
					/>
				)}
			/>
		</Dialog>
	);
}
