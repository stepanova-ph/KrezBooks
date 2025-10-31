import { Box, IconButton } from "@mui/material";
import MinimizeIcon from "@mui/icons-material/Remove";
import MaximizeIcon from "@mui/icons-material/CropSquare";
import CloseIcon from "@mui/icons-material/Close";
import theme from "src/lib/theme";

interface WindowButtonProps {
	onClick: () => void;
	type: "minimize" | "maximize" | "close";
	hoverBackgroundColor?: string;
}

export function WindowButton({
	onClick,
	type,
	hoverBackgroundColor,
}: WindowButtonProps) {
	const icon =
		type === "minimize" ? (
			<MinimizeIcon fontSize="small" />
		) : type === "maximize" ? (
			<MaximizeIcon fontSize="small" />
		) : (
			<CloseIcon fontSize="small" />
		);

	return (
		<IconButton
			size="small"
			onClick={onClick}
			tabIndex={-1}
			sx={{
				color: "#FFF",
				borderRadius: 0,
				height: 48,
				width: 46,
				"&:hover": {
					backgroundColor:
						hoverBackgroundColor ||
						(type === "close"
							? (theme) => theme.palette.error.main
							: "rgba(255, 255, 255, 0.1)"),
				},
			}}
		>
			{icon}
		</IconButton>
	);
}

export function WindowControls() {
	const handleMinimize = () => {
		window.electronAPI?.ipcRenderer.send("window-minimize");
	};

	const handleMaximize = () => {
		window.electronAPI?.ipcRenderer.send("window-maximize");
	};

	const handleClose = () => {
		window.electronAPI?.ipcRenderer.send("window-close");
	};

	return (
		<Box
			sx={{
				display: "flex",
				gap: 0,
				height: "100%",
				alignItems: "center",
			}}
		>
			<WindowButton type="minimize" onClick={handleMinimize} />
			<WindowButton type="maximize" onClick={handleMaximize} />
			<WindowButton type="close" onClick={handleClose} />
		</Box>
	);
}

export default WindowControls;
