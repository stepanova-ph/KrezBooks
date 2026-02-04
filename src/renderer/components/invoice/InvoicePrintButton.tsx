import { Button, Box, IconButton } from "@mui/material";
import { useState } from "react";
import { useGenerateInvoiceHTML, usePrintInvoiceToSystemPrinter } from "../../../hooks/usePrint";
import PrintIcon from "@mui/icons-material/Print";
import EmailIcon from "@mui/icons-material/Email";
import { Dialog } from "../common/dialog/Dialog";
import { AlertDialog } from "../common/dialog/AlertDialog";

interface InvoicePrintButtonsProps {
	invoicePrefix: string;
	invoiceNumber: string;
	variant?: "button" | "icon";
	invoiceEmail?: string;
	invoiceType?: number; // Invoice type to check if printing is supported
}

export function InvoicePrintButtons({
	invoicePrefix,
	invoiceNumber,
	variant = "button",
	invoiceEmail,
	invoiceType,
}: InvoicePrintButtonsProps) {
	// Only show print buttons for sale invoices (types 3 & 4)
	const isPrintSupported = invoiceType === 3 || invoiceType === 4;

	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewHTML, setPreviewHTML] = useState("");
	const [alertDialogOpen, setAlertDialogOpen] = useState(false);
	const [alertMessage, setAlertMessage] = useState("");

	const generateHTML = useGenerateInvoiceHTML();
	const printToSystemPrinter = usePrintInvoiceToSystemPrinter();

	if (!isPrintSupported) {
		return null;
	}

	const handlePreview = async () => {
		try {
			const html = await generateHTML.mutateAsync({
				invoicePrefix,
				invoiceNumber,
			});
			setPreviewHTML(html);
			setPreviewOpen(true);
		} catch (error) {
			console.error("Preview failed:", error);
			setAlertMessage("Nepodařilo se vygenerovat náhled faktury");
			setAlertDialogOpen(true);
		}
	};

	const handlePrint = async () => {
		try {
			await printToSystemPrinter.mutateAsync({
				invoicePrefix,
				invoiceNumber,
			});
			setPreviewOpen(false);
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

	return (
		<>
            {variant === "icon" ? 
            	<IconButton size="small" onClick={handlePreview} disabled={generateHTML.isPending} color="primary">
					<PrintIcon />
				</IconButton>
             : 		
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={handlePreview}
                        disabled={generateHTML.isPending}
                    >
                        Tisk
                    </Button>
                </Box>		
            }

			<Dialog
				open={previewOpen}
				onClose={() => setPreviewOpen(false)}
				title={`Náhled faktury ${invoicePrefix}${invoiceNumber}`}
				maxWidth="md"
				fullWidth
				actions={[
					{
						label: "Poslat emailem",
						onClick: handleEmail,
						variant: "outlined",
						icon: <EmailIcon />,
					},
					{
						label: "Tisknout",
						onClick: handlePrint,
						variant: "contained",
						icon: <PrintIcon />,
						disabled: printToSystemPrinter.isPending,
					},
				]}
			>
				<Box
					sx={{
						border: "1px solid #ddd",
						height: "75vh",
						overflow: "auto",
					}}
				>
					<div dangerouslySetInnerHTML={{ __html: previewHTML }} />
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