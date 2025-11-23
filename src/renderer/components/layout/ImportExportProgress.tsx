import {
	Box,
	LinearProgress,
	IconButton,
	Collapse,
	Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useState, useEffect } from "react";

interface ProgressLog {
	message: string;
	progress: number;
	timestamp: Date;
}

export function ImportExportProgress() {
	const [logs, setLogs] = useState<ProgressLog[]>([]);
	const [currentProgress, setCurrentProgress] = useState(0);
	const [isExpanded, setIsExpanded] = useState(false);
	const [isActive, setIsActive] = useState(false);

	useEffect(() => {
		// Listen for import progress
		const unsubscribeImport = window.electronAPI.importExport.onImportProgress(
			(data) => {
				setIsActive(true);
				setCurrentProgress(data.progress);
				setLogs((prev) => [...prev, { ...data, timestamp: new Date() }]);
			},
		);

		// Listen for export progress
		const unsubscribeExport = window.electronAPI.importExport.onExportProgress(
			(data) => {
				setIsActive(true);
				setCurrentProgress(data.progress);
				setLogs((prev) => [...prev, { ...data, timestamp: new Date() }]);
			},
		);

		return () => {
			unsubscribeImport();
			unsubscribeExport();
		};
	}, []);

	// Don't render if there's no activity
	if (!isActive) {
		return null;
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				position: "relative",
				mx: 2,
				width: "200px",
			}}
		>
			{/* Progress Bar */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1,
					width: "100%",
					mb: isExpanded ? 1 : 0,
				}}
			>
				<LinearProgress
					variant="determinate"
					value={currentProgress}
					sx={{
						flex: 1,
						height: 6,
						borderRadius: 1,
						backgroundColor: "rgba(255, 255, 255, 0.2)",
						"& .MuiLinearProgress-bar": {
							backgroundColor: "background.paper",
						},
					}}
				/>
				<IconButton
					size="small"
					onClick={() => setIsExpanded(!isExpanded)}
					sx={{
						color: "background.paper",
						padding: 0.5,
					}}
				>
					{isExpanded ? (
						<ExpandLessIcon fontSize="small" />
					) : (
						<ExpandMoreIcon fontSize="small" />
					)}
				</IconButton>
			</Box>

			{/* Collapsible Console */}
			<Collapse
				in={isExpanded}
				sx={{
					width: "100%",
					position: "absolute",
					top: "100%",
					left: 0,
					zIndex: 1000,
				}}
			>
				<Box
					sx={{
						backgroundColor: "background.paper",
						border: 1,
						borderColor: "divider",
						borderRadius: 1,
						maxHeight: 200,
						overflowY: "auto",
						p: 1,
						mt: 0.5,
						boxShadow: 2,
					}}
				>
					{logs.map((log, index) => (
						<Typography
							key={index}
							variant="caption"
							sx={{
								display: "block",
								fontFamily: "monospace",
								fontSize: "0.7rem",
								color: "text.secondary",
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
						>
							[{log.timestamp.toLocaleTimeString()}] {log.message}
						</Typography>
					))}
				</Box>
			</Collapse>
		</Box>
	);
}
