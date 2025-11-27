import { useMutation } from "@tanstack/react-query";

interface GenerateHTMLParams {
	invoicePrefix: string;
	invoiceNumber: string;
}

interface PrintToPDFParams {
	invoicePrefix: string;
	invoiceNumber: string;
	savePath?: string;
}

export function useGenerateInvoiceHTML() {
	return useMutation({
		mutationFn: async ({ invoicePrefix, invoiceNumber }: GenerateHTMLParams) => {
			const result = await window.electronAPI.print.generateInvoiceHTML(
				invoicePrefix,
				invoiceNumber,
			);

			if (!result.success) {
				throw new Error(result.error || "Failed to generate invoice HTML");
			}

			return result.data as string;
		},
	});
}

export function usePrintInvoiceToPDF() {
	return useMutation({
		mutationFn: async ({
			invoicePrefix,
			invoiceNumber,
			savePath,
		}: PrintToPDFParams) => {
			const result = await window.electronAPI.print.invoiceToPDF(
				invoicePrefix,
				invoiceNumber,
				savePath,
			);

			if (!result.success) {
				throw new Error(result.error || "Failed to print invoice to PDF");
			}

			return result.data as { path: string };
		},
	});
}