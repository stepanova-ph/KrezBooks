import { Box, Typography } from "@mui/material";
import { AppBarButton } from "./AppBarButton";
import { WindowControls } from "./WindowControls";
import { ImportExportProgress } from "./ImportExportProgress";
import React from "react";
import { SettingsDialog } from "../tabs/SettingsDialog";

export type AppPage = "domu" | "adresar" | "sklad" | "novy_doklad" | "doklady";

interface AppBarProps {
	currentPage: AppPage;
	onPageChange: (page: AppPage) => void;
}

export function AppBar({ currentPage, onPageChange }: AppBarProps) {
	const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);

	return (
		<Box
			sx={{
				width: "100%",
				height: 48,
				backgroundColor: "primary.main",
				display: "flex",
				alignItems: "flex-end",
				padding: "0 0 0 16px",
				boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
				position: "relative",
				zIndex: 100,
				WebkitAppRegion: "drag",
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					marginRight: 3,
					marginBottom: "8px",
					WebkitAppRegion: "no-drag",
				}}
			>
				<Typography
					variant="h6"
					sx={{
						color: (theme) => theme.palette.background.paper,
						fontWeight: 700,
						fontSize: "1.1rem",
						letterSpacing: "0.5px",
					}}
				>
					KrezBooks
				</Typography>
			</Box>

			<Box
				sx={{
					display: "flex",
					gap: 0,
					flex: 1,
					WebkitAppRegion: "no-drag",
				}}
			>
				<AppBarButton
					label="Domů"
					active={currentPage === "domu"}
					onClick={() => onPageChange("domu")}
				/>
				<AppBarButton
					label="Nový doklad"
					active={currentPage === "novy_doklad"}
					onClick={() => onPageChange("novy_doklad")}
				/>
				<AppBarButton
					label="Adresář"
					active={currentPage === "adresar"}
					onClick={() => onPageChange("adresar")}
				/>
				<AppBarButton
					label="Sklad"
					active={currentPage === "sklad"}
					onClick={() => onPageChange("sklad")}
				/>
				<AppBarButton
					label="Doklady"
					active={currentPage === "doklady"}
					onClick={() => onPageChange("doklady")}
				/>
				<AppBarButton
					label="Nastavení"
					onClick={() => setSettingsDialogOpen(true)}
				/>
			</Box>

			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					height: "100%",
					gap: 2,
					WebkitAppRegion: "no-drag",
				}}
			>
				<ImportExportProgress />
				<WindowControls />
			</Box>

			<SettingsDialog
				open={settingsDialogOpen}
				onClose={() => setSettingsDialogOpen(false)}
			/>
		</Box>
	);
}
