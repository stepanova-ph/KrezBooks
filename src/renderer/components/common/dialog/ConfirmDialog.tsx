import {
	Dialog as MuiDialog,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	useTheme,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useKeyboardShortcuts } from "../../../../hooks/keyboard/useKeyboardShortcuts";

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
		},
	);

	return (
		<MuiDialog
			open={open}
			onClose={onCancel}
			maxWidth="xs"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 1,
					boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
				},
			}}
		>
			<DialogContent sx={{ pt: 3 }}>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 2,
						textAlign: "center",
					}}
				>
					<WarningAmberIcon
						sx={{
							fontSize: 48,
							color,
						}}
					/>
					<Typography variant="h6" fontWeight={600}>
						{title}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{message}
					</Typography>
				</Box>
			</DialogContent>

			<DialogActions
				sx={{
					px: 3,
					pb: 2,
					gap: 1,
					justifyContent: "center",
				}}
			>
				<Button
					onClick={onCancel}
					variant="outlined"
					sx={{
						minWidth: 100,
						textTransform: "none",
					}}
				>
					{cancelLabel}
				</Button>
				<Button
					onClick={onConfirm}
					variant="contained"
					sx={{
						minWidth: 100,
						textTransform: "none",
						bgcolor: color,
						"&:hover": {
							bgcolor: color,
							filter: "brightness(0.9)",
						},
					}}
					autoFocus
				>
					{confirmLabel}
				</Button>
			</DialogActions>
		</MuiDialog>
	);
}
