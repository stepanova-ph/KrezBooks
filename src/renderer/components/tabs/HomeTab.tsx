import { useState } from "react";
import {
	Typography,
	Box,
	Button,
	Paper,
	Alert,
	CircularProgress,
	Divider,
} from "@mui/material";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InfoIcon from "@mui/icons-material/Info";
import { useQueryClient } from "@tanstack/react-query";
import { contactKeys } from "../../../hooks/useContacts";
import { itemKeys } from "../../../hooks/useItems";

function HomeTab() {
	const queryClient = useQueryClient();
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<{
		type: "success" | "error" | "info";
		text: string;
	} | null>(null);
	const [stats, setStats] = useState<{
		contacts: number;
		items: number;
		stockMovements: number;
		invoices: number;
	} | null>(null);

	const handleGetStats = async () => {
		setLoading(true);
		setMessage(null);
		try {
			const result = await window.electronAPI.admin.getDbStats();
			if (result.success) {
				setStats(result.data);
			} else {
				setMessage({
					type: "error",
					text: result.error || "Chyba při načítání statistik",
				});
			}
		} catch (error) {
			setMessage({ type: "error", text: "Chyba při komunikaci s databází" });
		} finally {
			setLoading(false);
		}
	};

	const handleRecreateTables = async () => {
		if (
			!window.confirm(
				"Smazat a znovu vytvořit všechny tabulky? VŠECHNA DATA budou ztracena!",
			)
		) {
			return;
		}

		setLoading(true);
		setMessage(null);
		try {
			const result = await window.electronAPI.admin.recreateTables();
			if (result.success) {
				setStats({ contacts: 0, items: 0, stockMovements: 0, invoices: 0 });
				setMessage({ type: "success", text: "Tabulky byly znovu vytvořeny" });

				queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
				queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
			} else {
				setMessage({
					type: "error",
					text: result.error || "Chyba při vytváření tabulek",
				});
			}
		} catch (error) {
			setMessage({ type: "error", text: "Chyba při vytváření tabulek" });
		} finally {
			setLoading(false);
		}
	};

	const handleClearDatabase = async () => {
		if (
			!window.confirm(
				"Opravdu chcete smazat VŠECHNA data z databáze? Tato akce je nevratná!",
			)
		) {
			return;
		}

		setLoading(true);
		setMessage(null);
		try {
			const result = await window.electronAPI.admin.clearDb();
			if (result.success) {
				setStats({ contacts: 0, items: 0, stockMovements: 0, invoices: 0 });
				setMessage({ type: "success", text: "Databáze byla úspěšně vymazána" });

				queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
				queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
			} else {
				setMessage({
					type: "error",
					text: result.error || "Chyba při mazání databáze",
				});
			}
		} catch (error) {
			setMessage({ type: "error", text: "Chyba při mazání databáze" });
		} finally {
			setLoading(false);
		}
		handleRecreateTables();
	};

	const handleFillTestData = async () => {
		if (
			!window.confirm(
				"Naplnit databázi testovacími daty? (20 kontaktů + 40 položek)",
			)
		) {
			return;
		}

		setLoading(true);
		setMessage(null);
		try {
			const result = await window.electronAPI.admin.fillTestData();
			if (result.success) {
				setMessage({
					type: "success",
					text: `Úspěšně přidáno: ${result.data.contactsAdded} kontaktů, ${result.data.itemsAdded} položek`,
				});

				queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
				queryClient.invalidateQueries({ queryKey: itemKeys.lists() });

				await handleGetStats();
			} else {
				setMessage({
					type: "error",
					text: result.error || "Chyba při plnění databáze",
				});
			}
		} catch (error) {
			setMessage({ type: "error", text: "Chyba při plnění databáze" });
		} finally {
			setLoading(false);
		}
	};

	const handleExportData = async () => {
		setLoading(true);
		setMessage(null);
		try {
			const result = await window.electronAPI.importExport.exportData();
			if (result.success) {
				setMessage({ type: "success", text: "Databáze byla exportována" });
			} else {
				setMessage({
					type: "error",
					text: result.error || "Chyba při exportu databáze",
				});
			}
		} catch (error) {
			setMessage({ type: "error", text: "Chyba při exportu databáze" });
		} finally {
			setLoading(false);
		}
	}	

	const handleImportContacts = async () => {
		setLoading(true);
		setMessage(null);
		try {
			const result = await window.electronAPI.importExport.importLegacyContacts();
			if (result.success) {
				setMessage({ type: "success", text: "Kontakty byly importovány" });
			} else {
				setMessage({
					type: "error",
					text: result.error || "Chyba při importu kontaktů",
				});
			}
		} catch (error) {
			setMessage({ type: "error", text: "Chyba při importu kontaktů" });
		} finally {
			setLoading(false);
		}
	}

	const handleImportItems = async () => {
		setLoading(true);
		setMessage(null);
		try {
			const result = await window.electronAPI.importExport.importLegacyItems();
			if (result.success) {
				setMessage({ type: "success", text: "Položky byly importovány" });
			} else {
				setMessage({
					type: "error",
					text: result.error || "Chyba při importu položek",
				});
			}
		} catch (error) {
			setMessage({ type: "error", text: "Chyba při importu položek" });
		} finally {
			setLoading(false);
		}
	}



	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" gutterBottom>
				Dashboard
			</Typography>
			<Typography variant="body1" color="text.secondary" paragraph>
				Rychlá volba na kontakty, poslední pohyby skladu, nedávné faktury...
			</Typography>

			<Divider sx={{ my: 3 }} />

			{/* Admin Panel */}
			<Paper
				elevation={3}
				sx={{
					p: 3,
					backgroundColor: "background.paper",
					border: "2px solid",
					borderColor: "secondary.light",
				}}
			>
				<Typography variant="h5" gutterBottom color="secondary.light">
					SPRÁVA DATABÁZE (dev admin)
				</Typography>
				{message && (
					<Alert
						severity={message.type}
						sx={{ mb: 2 }}
						onClose={() => setMessage(null)}
					>
						{message.text}
					</Alert>
				)}
				{/* Stats Display */}
				{stats && (
					<Box
						sx={{
							mb: 3,
							p: 2,
							backgroundColor: "action.hover",
							borderRadius: 1,
						}}
					>
						<Typography variant="body1">
							<strong>Aktuální stav databáze:</strong>
						</Typography>
						<Typography variant="body2">
							KONTAKTY: <strong>{stats.contacts}</strong>
						</Typography>
						<Typography variant="body2">
							POLOŽKY: <strong>{stats.items}</strong>
						</Typography>
						<Typography variant="body2">
							POHYBY: <strong>{stats.stockMovements}</strong>
						</Typography>
						<Typography variant="body2">
							DOKLADY: <strong>{stats.invoices}</strong>
						</Typography>
					</Box>
				)}
				{/* Action Buttons */}
				<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
					<Button
						variant="outlined"
						startIcon={loading ? <CircularProgress size={20} /> : <InfoIcon />}
						onClick={handleGetStats}
						disabled={loading}
					>
						Zobrazit statistiky
					</Button>

					<Button
						variant="contained"
						color="primary"
						startIcon={
							loading ? <CircularProgress size={20} /> : <CloudUploadIcon />
						}
						onClick={handleFillTestData}
						disabled={loading}
					>
						Naplnit testovacími daty
					</Button>

					<Button
						variant="contained"
						color="error"
						startIcon={
							loading ? <CircularProgress size={20} /> : <DeleteSweepIcon />
						}
						onClick={handleClearDatabase}
						disabled={loading}
					>
						Smazat všechna data
					</Button>
					
					<Button
						variant="contained"
						startIcon={
							loading ? <CircularProgress size={20} /> : <DeleteSweepIcon />
						}
						onClick={handleExportData}
						disabled={loading}
					>
						Exportovat data
					</Button>
					<Button
						variant="contained"
						startIcon={
							loading ? <CircularProgress size={20} /> : <DeleteSweepIcon />
						}
						onClick={handleImportContacts}
						disabled={loading}
					>
						Importovat adresář
					</Button>
					<Button
						variant="contained"
						startIcon={
							loading ? <CircularProgress size={20} /> : <DeleteSweepIcon />
						}
						onClick={handleImportItems}
						disabled={loading}
					>
						Importovat sklad
					</Button>
				</Box>
			</Paper>
		</Box>
	);
}

export default HomeTab;
