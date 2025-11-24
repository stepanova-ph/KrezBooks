import {
	Box,
	LinearProgress,
	IconButton,
	Collapse,
	Typography,
	Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import NotInterestedIcon from '@mui/icons-material/NotInterested';
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
	const [hasNewMessages, setHasNewMessages] = useState(false);

	useEffect(() => {
		const unsubscribeImport = window.electronAPI.importExport.onImportProgress(
			(data) => {
				setIsActive(true);
				setCurrentProgress(data.progress);
				setLogs((prev) => [...prev, { ...data, timestamp: new Date() }]);
				setHasNewMessages((prev) => {
					if (!isExpanded) {
						return true;
					}
					return prev;
				});
			},
		);

		const unsubscribeExport = window.electronAPI.importExport.onExportProgress(
			(data) => {
				setIsActive(true);
				setCurrentProgress(data.progress);
				setLogs((prev) => [...prev, { ...data, timestamp: new Date() }]);
				setHasNewMessages((prev) => {
					if (!isExpanded) {
						return true;
					}
					return prev;
				});
			},
		);

		return () => {
			unsubscribeImport();
			unsubscribeExport();
		};
	}, [isExpanded]);

	useEffect(() => {
		if (isExpanded) {
			setHasNewMessages(false);
		}
	}, [isExpanded]);

	const handleClearConsole = () => {
		setLogs([]);
		setHasNewMessages(false);
		setIsActive(false);
		setCurrentProgress(0);
		setIsExpanded(false);
	};

	const formatTimestamp = (date: Date) => {
		return date.toLocaleTimeString("cs-CZ", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
	};

	const formatMessage = (message: string) => {
		if (
			message.includes("zahájen") ||
			message.includes("dokončen") ||
			message.includes("zahájeno") ||
			message.includes("dokončeno")
		) {
			return <strong>{message}</strong>;
		}
		return message;
	};

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
				width: "300px",
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
				<Tooltip title={isExpanded ? "Sbalit konzoli" : "Rozbalit konzoli"}>
					<IconButton
						size="medium"
						onClick={() => setIsExpanded(!isExpanded)}
						sx={{
							color: hasNewMessages && !isExpanded
								? "primary.light"
								: "background.paper",
							padding: hasNewMessages && !isExpanded ? 0.75 : 0.5,
							transition: "color 0.3s ease-in-out",
							animation: hasNewMessages && !isExpanded
								? "heartbeatGlow 2s ease-in-out infinite"
								: "none",
							"@keyframes heartbeatGlow": {
								"0%, 40%, 80%, 100%": {
									transform: "scale(1)",
									filter: "brightness(1) drop-shadow(0 0 0px rgba(255, 255, 255, 0))",
								},
								"10%": {
									transform: "scale(1.20)",
									filter: "brightness(1.4) drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))",
								},
								"20%": {
									transform: "scale(1)",
									filter: "brightness(1) drop-shadow(0 0 0px rgba(255, 255, 255, 0))",
								},
								"30%": {
									transform: "scale(1.20)",
									filter: "brightness(1.4) drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))",
								},
							},
						}}
					>
						{isExpanded ? (
							<ExpandLessIcon fontSize="medium" />
						) : (
							<ExpandMoreIcon fontSize="medium" />
						)}
					</IconButton>
				</Tooltip>
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
						mt: 0.5,
						boxShadow: 2,
					}}
				>
					{/* Console header with clear button */}
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							px: 1,
							pt: 1,
							pb: 0.5,
							borderBottom: 1,
							borderColor: "divider",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								fontFamily: "monospace",
								fontWeight: "bold",
								color: "text.secondary",
							}}
						>
							Konzole
						</Typography>
						<Tooltip title="Vymazat konzoli">
							<IconButton
								size="small"
								onClick={handleClearConsole}
								sx={{
									padding: 0.5,
									"&:hover": {
										color: "error.main",
									},
								}}
							>
								<NotInterestedIcon sx={{ fontSize: "0.9rem" }} />
							</IconButton>
						</Tooltip>
					</Box>

					{/* Console content */}
					<Box sx={{ p: 1 }}>
						{logs.map((log, index) => (
							<Typography
								key={index}
								component="div"
								variant="caption"
								sx={{
									fontFamily: "monospace",
									fontSize: "0.7rem",
									color: "text.secondary",
									wordWrap: "break-word",
									whiteSpace: "pre-wrap",
									mb: 0.5,
								}}
							>
								<Box
									component="span"
									sx={{
										display: "inline",
										mr: 0.5,
									}}
								>
									[{formatTimestamp(log.timestamp)}]
								</Box>
								{formatMessage(log.message)}
							</Typography>
						))}
					</Box>
				</Box>
			</Collapse>
		</Box>
	);
}
