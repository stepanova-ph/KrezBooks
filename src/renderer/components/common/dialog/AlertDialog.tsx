import { Box, Typography } from "@mui/material";
import { useKeyboardShortcuts } from "../../../../hooks/keyboard/useKeyboardShortcuts";
import { Dialog } from "./Dialog";

interface AlertDialogProps {
	open: boolean;
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onCancel?: () => void;
}

export function AlertDialog({
	open,
	title,
	message,
	confirmLabel = "OK",
	cancelLabel,
	onConfirm,
	onCancel,
}: AlertDialogProps) {
	const handleClose = onCancel || onConfirm;

	useKeyboardShortcuts(
		{
			Enter: onConfirm,
			Escape: handleClose,
		},
		{
			disabled: !open,
			preventInInputs: false,
		},
	);

	const actions =
		cancelLabel && onCancel
			? [
					{
						label: cancelLabel,
						onClick: onCancel,
						variant: "outlined" as const,
					},
					{
						label: confirmLabel,
						onClick: onConfirm,
						variant: "contained" as const,
						color: "error" as const,
					},
				]
			: [
					{
						label: confirmLabel,
						onClick: onConfirm,
						variant: "contained" as const,
					},
				];

	return (
		<Dialog
			noCloseButton
			open={open}
			onClose={handleClose}
			title={title}
			maxWidth="xs"
			actions={actions}
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
				<Typography
					variant="body1"
					color="text.primary"
					sx={{ whiteSpace: "pre-line" }}
				>
					{message}
				</Typography>
			</Box>
		</Dialog>
	);
}
