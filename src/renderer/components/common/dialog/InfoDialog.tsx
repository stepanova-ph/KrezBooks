import { Box, Typography, useTheme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useKeyboardShortcuts } from "../../../../hooks/keyboard/useKeyboardShortcuts";
import { Dialog } from "./Dialog";

interface InfoDialogProps {
	open: boolean;
	title: string;
	message: string;
	confirmLabel?: string;
	onConfirm: () => void;
}

export function InfoDialog({
	open,
	title,
	message,
	confirmLabel = "OK",
	onConfirm,
}: InfoDialogProps) {
	const theme = useTheme();

	useKeyboardShortcuts(
		{
			Enter: onConfirm,
			Escape: onConfirm,
		},
		{
			disabled: !open,
			preventInInputs: false,
		},
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
				<CheckCircleIcon
					sx={{
						fontSize: 48,
						color: theme.palette.success.main,
					}}
				/>
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
