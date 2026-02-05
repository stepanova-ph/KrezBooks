import { Box } from "@mui/material";
import { useState, useEffect } from "react";
import { Dialog } from "../common/dialog/Dialog";
import { useGenerateInvoiceHTML, usePrintInvoiceToSystemPrinter, usePrintInvoiceToPDF } from "../../../hooks/usePrint";
import PrintIcon from "@mui/icons-material/Print";
import EmailIcon from "@mui/icons-material/Email";
import { AlertDialog } from "../common/dialog/AlertDialog";
import { COMPANY_INFO } from "../../../config/companyInfo";

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
	const [alertTitle, setAlertTitle] = useState("Chyba");
	const [isLoading, setIsLoading] = useState(false);

	const generateHTML = useGenerateInvoiceHTML();
	const printToSystemPrinter = usePrintInvoiceToSystemPrinter();
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
					setAlertTitle("Chyba");
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
			setAlertTitle("Chyba");
			setAlertMessage("Nepodařilo se vytisknout fakturu");
			setAlertDialogOpen(true);
		}
	};

	const handleEmail = async () => {
		try {
			// First, generate the PDF
			const pdfResult = await printToPDF.mutateAsync({
				invoicePrefix,
				invoiceNumber,
			});

			const email = invoiceEmail || "";
			const subject = `Faktura ${invoicePrefix}${invoiceNumber}`;
			const body = `Dobrý den,\n\nv příloze zasílám fakturu ${invoicePrefix}${invoiceNumber}.\n\nS pozdravem,\n${COMPANY_INFO.ownerName}\n${COMPANY_INFO.companyName}`;

			console.log("Opening email with:", { email, subject, body, pdfPath: pdfResult.path });
			const result = await window.electronAPI.shell.openEmail(email, subject, body, pdfResult.path);
			console.log("Email result:", result);

			// Inform user about success
			if (result.success && result.data?.opened) {
				setAlertTitle("Hotovo");
				setAlertMessage(`E-mailový návrh byl vytvořen s přílohou faktury.\n\nProsím zkontrolujte a odešlete e-mail.`);
				setAlertDialogOpen(true);
			}
		} catch (error) {
			console.error("Email failed:", error);
			setAlertTitle("Chyba");
			setAlertMessage("Nepodařilo se otevřít e-mailového klienta nebo vygenerovat PDF");
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
				title={alertTitle}
				message={alertMessage}
				onConfirm={() => setAlertDialogOpen(false)}
			/>
		</>
	);
}
