import { Dialog } from "../common/dialog/Dialog";
import { AlertDialog } from "../common/dialog/AlertDialog";
import { FormSection } from "../common/form/FormSection";
import { useState } from "react";
import {
	Box,
	TextField,
	Button,
	Switch,
	FormControlLabel,
	Alert,
	Typography,
} from "@mui/material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import InfoIcon from "@mui/icons-material/Info";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DatasetIcon from "@mui/icons-material/Dataset";
import { useDataImportExport } from "../../../hooks/useDataImportExport";

interface SettingsDialogProps {
	open: boolean;
	onClose: () => void;
}

export const SettingsDialog = ({ open, onClose }: SettingsDialogProps) => {
	// Import state
	const [importPath, setImportPath] = useState("");
	const [isLegacyImport, setIsLegacyImport] = useState(false);
	const [importInProgress, setImportInProgress] = useState(false);

	// Export state
	const [exportPath, setExportPath] = useState("");
	const [exportInProgress, setExportInProgress] = useState(false);

	// Admin state
	const [stats, setStats] = useState<{
		contacts: number;
		items: number;
		stockMovements: number;
		invoices: number;
	} | null>(null);
	const [adminLoading, setAdminLoading] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	// Messages
	const [importMessage, setImportMessage] = useState<{
		type: "success" | "error" | "info";
		text: string;
	} | null>(null);
	const [exportMessage, setExportMessage] = useState<{
		type: "success" | "error" | "info";
		text: string;
	} | null>(null);
	const [adminMessage, setAdminMessage] = useState<{
		type: "success" | "error" | "info";
		text: string;
	} | null>(null);

	// Use custom hook for import/export with automatic query invalidation
	const { invalidateAllQueries } = useDataImportExport(
		(result) => {
			setImportInProgress(false);
			if (result.success) {
				setImportMessage({
					type: "success",
					text: "Import dokončen úspěšně",
				});
			} else {
				setImportMessage({
					type: "error",
					text: result.error || "Import selhal",
				});
			}
		},
		(result) => {
			setExportInProgress(false);
			if (result.success) {
				setExportMessage({
					type: "success",
					text: `Export dokončen úspěšně do: ${result.path}`,
				});
			} else {
				setExportMessage({
					type: "error",
					text: result.error || "Export selhal",
				});
			}
		},
	);

	const handleSelectImportDirectory = async () => {
		const result = await window.electronAPI.dialog.selectDirectory(
			isLegacyImport
				? "Vyberte složku s TSV soubory"
				: "Vyberte složku s CSV soubory",
		);

		if (result.success && result.path) {
			setImportPath(result.path);
		}
	};

	const handleSelectExportDirectory = async () => {
		const result = await window.electronAPI.dialog.selectDirectory(
			"Vyberte složku pro export",
		);

		if (result.success && result.path) {
			setExportPath(result.path);
		}
	};

	const handleImport = async () => {
		if (!importPath) {
			setImportMessage({ type: "error", text: "Vyberte prosím složku" });
			return;
		}

		setImportInProgress(true);
		setImportMessage({
			type: "info",
			text: "Import probíhá... (můžete zavřít tento dialog)",
		});

		try {
			const result = isLegacyImport
				? await window.electronAPI.importExport.importLegacyData(importPath)
				: await window.electronAPI.importExport.importData(importPath);

			if (!result.success) {
				setImportInProgress(false);
				setImportMessage({
					type: "error",
					text: result.error || "Import se nepodařilo spustit",
				});
			}
			// If success, the completion will be handled by the onImportComplete listener
		} catch (error: any) {
			setImportInProgress(false);
			setImportMessage({
				type: "error",
				text: `Chyba: ${error.message}`,
			});
		}
	};

	const handleExport = async () => {
		if (!exportPath) {
			setExportMessage({ type: "error", text: "Vyberte prosím složku" });
			return;
		}

		setExportInProgress(true);
		setExportMessage({
			type: "info",
			text: "Export probíhá... (můžete zavřít tento dialog)",
		});

		try {
			const result =
				await window.electronAPI.importExport.exportData(exportPath);

			if (!result.success) {
				setExportInProgress(false);
				setExportMessage({
					type: "error",
					text: result.error || "Export se nepodařilo spustit",
				});
			}
			// If success, the completion will be handled by the onExportComplete listener
		} catch (error: any) {
			setExportInProgress(false);
			setExportMessage({
				type: "error",
				text: `Chyba: ${error.message}`,
			});
		}
	};

	const handleToggleStats = async () => {
		// If stats are shown, hide them
		if (stats) {
			setStats(null);
			return;
		}

		// Otherwise, fetch and show them
		setAdminLoading(true);
		setAdminMessage(null);
		try {
			const result = await window.electronAPI.admin.getDbStats();
			if (result.success && result.data) {
				setStats(result.data);
			} else {
				setAdminMessage({
					type: "error",
					text: result.error || "Chyba při načítání statistik",
				});
			}
		} catch (error) {
			setAdminMessage({
				type: "error",
				text: "Chyba při komunikaci s databází",
			});
		} finally {
			setAdminLoading(false);
		}
	};

	const handleConfirmClearDatabase = async () => {
		setShowDeleteConfirm(false);
		setAdminLoading(true);
		setAdminMessage(null);
		try {
			const result = await window.electronAPI.admin.clearDb();
			if (result.success) {
				setStats({ contacts: 0, items: 0, stockMovements: 0, invoices: 0 });
				setAdminMessage({
					type: "success",
					text: "Databáze byla úspěšně vymazána",
				});
				// Invalidate all queries to refresh the UI
				invalidateAllQueries();
			} else {
				setAdminMessage({
					type: "error",
					text: result.error || "Chyba při mazání databáze",
				});
			}
		} catch (error) {
			setAdminMessage({ type: "error", text: "Chyba při mazání databáze" });
		} finally {
			setAdminLoading(false);
		}
	};

	const handleFillTestData = async () => {
		setAdminLoading(true);
		setAdminMessage(null);
		try {
			const result = await window.electronAPI.admin.fillTestData();
			if (result.success && result.data) {
				setAdminMessage({
					type: "success",
					text: `Přidáno ${result.data.contactsAdded} kontaktů a ${result.data.itemsAdded} položek`,
				});
				// Invalidate all queries to refresh the UI
				invalidateAllQueries();
				// Refresh stats if they're shown
				if (stats) {
					const statsResult = await window.electronAPI.admin.getDbStats();
					if (statsResult.success && statsResult.data) {
						setStats(statsResult.data);
					}
				}
			} else {
				setAdminMessage({
					type: "error",
					text: result.error || "Chyba při naplňování testovacími daty",
				});
			}
		} catch (error) {
			setAdminMessage({
				type: "error",
				text: "Chyba při naplňování testovacími daty",
			});
		} finally {
			setAdminLoading(false);
		}
	};

	return (
		<Dialog open={open} title="Nastavení" onClose={onClose}>
			<FormSection
				title="Import"
				actions={
					<FormControlLabel
						control={
							<Switch
								checked={isLegacyImport}
								onChange={(e) => setIsLegacyImport(e.target.checked)}
								disabled={importInProgress}
								size="small"
							/>
						}
						label="Legacy (.tsv)"
						sx={{ m: 0 }}
					/>
				}
			>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: 2 }}>
					<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
						<TextField
							fullWidth
							label="Cesta ke složce"
							value={importPath}
							onChange={(e) => setImportPath(e.target.value)}
							disabled={importInProgress}
							size="small"
							placeholder={
								isLegacyImport
									? "Složka s items.tsv a contacts.tsv"
									: "Složka s CSV soubory"
							}
						/>
						<Button
							variant="outlined"
							onClick={handleSelectImportDirectory}
							disabled={importInProgress}
							startIcon={<FolderOpenIcon />}
							sx={{ whiteSpace: "nowrap", paddingX: 6 }}
						>
							Vybrat adresář
						</Button>
					</Box>

					<Button
						variant="contained"
						onClick={handleImport}
						disabled={importInProgress || !importPath}
						fullWidth
					>
						{importInProgress ? "Probíhá import..." : "Importovat"}
					</Button>

					{importMessage && (
						<Alert
							severity={importMessage.type}
							onClose={() => setImportMessage(null)}
						>
							{importMessage.text}
						</Alert>
					)}
				</Box>
			</FormSection>

			<FormSection title="Export">
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: 2 }}>
					<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
						<TextField
							fullWidth
							label="Cesta ke složce"
							value={exportPath}
							onChange={(e) => setExportPath(e.target.value)}
							disabled={exportInProgress}
							size="small"
							placeholder="Cílová složka pro export"
						/>
						<Button
							variant="outlined"
							onClick={handleSelectExportDirectory}
							disabled={exportInProgress}
							startIcon={<FolderOpenIcon />}
							sx={{ whiteSpace: "nowrap", paddingX: 6 }}
						>
							Vybrat adresář
						</Button>
					</Box>

					<Button
						variant="contained"
						onClick={handleExport}
						disabled={exportInProgress || !exportPath}
						fullWidth
					>
						{exportInProgress ? "Probíhá export..." : "Exportovat"}
					</Button>

					{exportMessage && (
						<Alert
							severity={exportMessage.type}
							onClose={() => setExportMessage(null)}
						>
							{exportMessage.text}
						</Alert>
					)}
				</Box>
			</FormSection>

			<FormSection title="Pokročilé nástroje" hideDivider>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: 2 }}>
					{stats && (
						<Box
							sx={{
								p: 2,
								backgroundColor: "action.hover",
								borderRadius: 1,
							}}
						>
							<Typography variant="body2">
								Kontakty: <strong>{stats.contacts}</strong>
							</Typography>
							<Typography variant="body2">
								Položky: <strong>{stats.items}</strong>
							</Typography>
							<Typography variant="body2">
								Pohyby: <strong>{stats.stockMovements}</strong>
							</Typography>
							<Typography variant="body2">
								Doklady: <strong>{stats.invoices}</strong>
							</Typography>
						</Box>
					)}

					<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
						<Box sx={{ display: "flex", gap: 1 }}>
							<Button
								variant="outlined"
								onClick={handleToggleStats}
								disabled={adminLoading}
								startIcon={stats ? <VisibilityOffIcon /> : <InfoIcon />}
								fullWidth
							>
								{stats ? "Skrýt statistiku" : "Zobrazit statistiku"}
							</Button>
							<Button
								variant="outlined"
								onClick={handleFillTestData}
								disabled={adminLoading}
								startIcon={<DatasetIcon />}
								fullWidth
							>
								Naplnit testovacími daty
							</Button>
						</Box>
						<Button
							variant="outlined"
							color="error"
							onClick={() => setShowDeleteConfirm(true)}
							disabled={adminLoading}
							startIcon={<DeleteSweepIcon />}
							fullWidth
						>
							Vymazat všechna data
						</Button>
					</Box>

					{adminMessage && (
						<Alert
							severity={adminMessage.type}
							onClose={() => setAdminMessage(null)}
						>
							{adminMessage.text}
						</Alert>
					)}
				</Box>
			</FormSection>

			<AlertDialog
				open={showDeleteConfirm}
				title="Smazat všechna data"
				message="Opravdu chcete smazat VŠECHNA data z databáze? Tato akce je nevratná!"
				confirmLabel="Smazat"
				cancelLabel="Zrušit"
				onConfirm={handleConfirmClearDatabase}
				onCancel={() => setShowDeleteConfirm(false)}
			/>
		</Dialog>
	);
};
