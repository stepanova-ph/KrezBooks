import { Button, Box, IconButton } from "@mui/material";
import { useState } from "react";
import { useGenerateInvoiceHTML, usePrintInvoiceToSystemPrinter, usePrintInvoiceToPDF } from "../../../hooks/usePrint";
import PrintIcon from "@mui/icons-material/Print";
import EmailIcon from "@mui/icons-material/Email";
import { Dialog } from "../common/dialog/Dialog";
import { AlertDialog } from "../common/dialog/AlertDialog";
import { COMPANY_INFO } from "../../../config/companyInfo";

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
	// Only show print buttons for sale invoices (types 3 & 4) and dobropis (type 6)
	const isPrintSupported =
		invoiceType === 3 || invoiceType === 4 || invoiceType === 6;
	const isReturn = invoiceType === 6;
	// Czech document name in nominative/accusative ("faktura"/"fakturu") and genitive ("faktury")
	const docName = isReturn ? "Dobropis" : "Faktura";
	const docNameAccusative = isReturn ? "dobropis" : "fakturu";
	const docNameGenitive = isReturn ? "dobropisu" : "faktury";

	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewHTML, setPreviewHTML] = useState("");
	const [alertDialogOpen, setAlertDialogOpen] = useState(false);
	const [alertMessage, setAlertMessage] = useState("");
	const [alertTitle, setAlertTitle] = useState("Chyba");

	const generateHTML = useGenerateInvoiceHTML();
	const printToSystemPrinter = usePrintInvoiceToSystemPrinter();
	const printToPDF = usePrintInvoiceToPDF();

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
			setAlertTitle("Chyba");
			setAlertMessage(`Nepodařilo se vygenerovat náhled ${docNameGenitive}`);
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
			setAlertTitle("Chyba");
			setAlertMessage(`Nepodařilo se vytisknout ${docNameAccusative}`);
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
			const subject = `${docName} ${invoicePrefix}${invoiceNumber}`;
			const body = `Dobrý den,\n\nv příloze zasílám ${docNameAccusative} ${invoicePrefix}${invoiceNumber}.\n\nS pozdravem,\n${COMPANY_INFO.ownerName}\n${COMPANY_INFO.companyName}`;

			console.log("Opening email with:", { email, subject, body, pdfPath: pdfResult.path });
			const result = await window.electronAPI.shell.openEmail(email, subject, body, pdfResult.path);
			console.log("Email result:", result);

			// Inform user about success
			if (result.success && result.data?.opened) {
				setAlertTitle("Hotovo");
				setAlertMessage(`E-mailový návrh byl vytvořen s přílohou ${docNameGenitive}.\n\nProsím zkontrolujte a odešlete e-mail.`);
				setAlertDialogOpen(true);
			}
		} catch (error) {
			console.error("Email failed:", error);
			setAlertTitle("Chyba");
			setAlertMessage("Nepodařilo se otevřít e-mailového klienta nebo vygenerovat PDF");
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
				title={`Náhled ${docNameGenitive} ${invoicePrefix}${invoiceNumber}`}
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
				title={alertTitle}
				message={alertMessage}
				onConfirm={() => setAlertDialogOpen(false)}
			/>
		</>
	);
}