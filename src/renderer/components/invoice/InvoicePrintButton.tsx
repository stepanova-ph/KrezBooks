import { Button, Box, IconButton } from "@mui/material";
import { useState } from "react";
import { useGenerateInvoiceHTML, usePrintInvoiceToPDF } from "../../../hooks/usePrint";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EmailIcon from "@mui/icons-material/Email";
import { Dialog } from "../common/dialog/Dialog";
import { InfoDialog } from "../common/dialog/InfoDialog";
import { AlertDialog } from "../common/dialog/AlertDialog";

interface InvoicePrintButtonsProps {
	invoicePrefix: string;
	invoiceNumber: string;
	variant?: "button" | "icon";
	invoiceEmail?: string;
}

export function InvoicePrintButtons({
	invoicePrefix,
	invoiceNumber,
	variant = "button",
	invoiceEmail,
}: InvoicePrintButtonsProps) {
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewHTML, setPreviewHTML] = useState("");
	const [infoDialogOpen, setInfoDialogOpen] = useState(false);
	const [infoMessage, setInfoMessage] = useState("");
	const [alertDialogOpen, setAlertDialogOpen] = useState(false);
	const [alertMessage, setAlertMessage] = useState("");

	const generateHTML = useGenerateInvoiceHTML();
	const printToPDF = usePrintInvoiceToPDF();

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
						label: "Vytisknout do PDF",
						onClick: handlePrintToPDF,
						variant: "contained",
						icon: <PictureAsPdfIcon />,
						disabled: printToPDF.isPending,
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