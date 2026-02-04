import { Box } from "@mui/material";
import { useState, useEffect } from "react";
import { Dialog } from "../common/dialog/Dialog";
import { useGenerateInvoiceHTML, usePrintInvoiceToSystemPrinter } from "../../../hooks/usePrint";
import PrintIcon from "@mui/icons-material/Print";
import EmailIcon from "@mui/icons-material/Email";
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
	const [alertDialogOpen, setAlertDialogOpen] = useState(false);
	const [alertMessage, setAlertMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const generateHTML = useGenerateInvoiceHTML();
	const printToSystemPrinter = usePrintInvoiceToSystemPrinter();

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

	const handlePrint = async () => {
		try {
			await printToSystemPrinter.mutateAsync({
				invoicePrefix,
				invoiceNumber,
			});
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
						label: "Tisknout",
						onClick: handlePrint,
						variant: "outlined",
						icon: <PrintIcon />,
						disabled: printToSystemPrinter.isPending,
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

			<AlertDialog
				open={alertDialogOpen}
				title="Chyba"
				message={alertMessage}
				onConfirm={() => setAlertDialogOpen(false)}
			/>
		</>
	);
}
