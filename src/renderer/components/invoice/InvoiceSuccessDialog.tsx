import { Box } from "@mui/material";
import { useState, useEffect } from "react";
import { Dialog } from "../common/dialog/Dialog";
import { useGenerateInvoiceHTML, usePrintInvoiceToPDF } from "../../../hooks/usePrint";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EmailIcon from "@mui/icons-material/Email";
import { InfoDialog } from "../common/dialog/InfoDialog";
import { AlertDialog } from "../common/dialog/AlertDialog";

interface InvoiceSuccessDialogProps {
	open: boolean;
	onClose: () => void;
	invoicePrefix: string;
	invoiceNumber: string;
	invoiceEmail?: string;
}

export function InvoiceSuccessDialog({
	open,
	onClose,
	invoicePrefix,
	invoiceNumber,
	invoiceEmail,
}: InvoiceSuccessDialogProps) {
	const [previewHTML, setPreviewHTML] = useState("");
	const [infoDialogOpen, setInfoDialogOpen] = useState(false);
	const [infoMessage, setInfoMessage] = useState("");
	const [alertDialogOpen, setAlertDialogOpen] = useState(false);
	const [alertMessage, setAlertMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const generateHTML = useGenerateInvoiceHTML();
	const printToPDF = usePrintInvoiceToPDF();

	// Load preview when dialog opens
	useEffect(() => {
		if (open && !previewHTML) {
			setIsLoading(true);
			generateHTML
				.mutateAsync({
					invoicePrefix,
					invoiceNumber,
				})
				.then((html) => {
					setPreviewHTML(html);
				})
				.catch((error) => {
					console.error("Preview failed:", error);
					setAlertMessage("Nepodařilo se vygenerovat náhled faktury");
					setAlertDialogOpen(true);
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, [open, invoicePrefix, invoiceNumber]);

	const handlePrintToPDF = async () => {
		try {
			const dialogResult = await window.electronAPI.dialog.saveFile(
				`Faktura_${invoicePrefix}${invoiceNumber}.pdf`,
				"Uložit fakturu jako PDF",
			);

			if (dialogResult.canceled || !dialogResult.path) {
				return;
			}

			const result = await printToPDF.mutateAsync({
				invoicePrefix,
				invoiceNumber,
				savePath: dialogResult.path,
			});
			setInfoMessage(`Faktura byla uložena do:\n${result.path}`);
			setInfoDialogOpen(true);
		} catch (error) {
			console.error("Print failed:", error);
			setAlertMessage("Nepodařilo se vytisknout fakturu");
			setAlertDialogOpen(true);
		}
	};

	const handleEmail = async () => {
		try {
			const email = invoiceEmail || "";
			const subject = `Faktura ${invoicePrefix}${invoiceNumber}`;
			const body = `Dobrý den,\n\nv příloze zasílám fakturu ${invoicePrefix}${invoiceNumber}.\n\nS pozdravem`;

			console.log("Opening email with:", { email, subject, body });
			const result = await window.electronAPI.shell.openEmail(email, subject, body);
			console.log("Email result:", result);
		} catch (error) {
			console.error("Email failed:", error);
			setAlertMessage("Nepodařilo se otevřít e-mailového klienta");
			setAlertDialogOpen(true);
		}
	};

	const handleClose = () => {
		setPreviewHTML(""); // Reset preview for next time
		onClose();
	};

	return (
		<>
			<Dialog
				open={open}
				onClose={handleClose}
				title={`Faktura ${invoicePrefix}${invoiceNumber} byla úspěšně vytvořena`}
				maxWidth="md"
				fullWidth
				actions={[
					{
						label: "Vytisknout do PDF",
						onClick: handlePrintToPDF,
						variant: "outlined",
						icon: <PictureAsPdfIcon />,
						disabled: printToPDF.isPending,
					},
					{
						label: "Poslat emailem",
						onClick: handleEmail,
						variant: "outlined",
						icon: <EmailIcon />,
					},
						{
						label: "OK",
						onClick: handleClose,
						variant: "contained",
					},
				]}
			>
				<Box
					sx={{
						border: "1px solid #ddd",
						height: "75vh",
						overflow: "auto",
						display: "flex",
						alignItems: isLoading ? "center" : "flex-start",
						justifyContent: isLoading ? "center" : "flex-start",
					}}
				>
					{isLoading ? (
						<Box sx={{ textAlign: "center", p: 4 }}>Načítám náhled...</Box>
					) : (
						<div dangerouslySetInnerHTML={{ __html: previewHTML }} />
					)}
				</Box>
			</Dialog>

			<InfoDialog
				open={infoDialogOpen}
				title="Úspěch"
				message={infoMessage}
				onConfirm={() => setInfoDialogOpen(false)}
			/>

			<AlertDialog
				open={alertDialogOpen}
				title="Chyba"
				message={alertMessage}
				onConfirm={() => setAlertDialogOpen(false)}
			/>
		</>
	);
}
