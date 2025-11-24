import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface ImportResult {
	success: boolean;
	canceled?: boolean;
	imported?: {
		contacts: number;
		items: number;
		invoices: number;
		stock_movements: number;
	};
	skipped?: {
		contacts: number;
		items: number;
		invoices: number;
		stock_movements: number;
	};
	logFile?: string;
	error?: string;
}

interface ExportResult {
	success: boolean;
	path?: string;
	error?: string;
}

export function useDataImportExport(
	onImportComplete?: (result: ImportResult) => void,
	onExportComplete?: (result: ExportResult) => void,
) {
	const queryClient = useQueryClient();

	const invalidateAllQueries = useCallback(() => {
		queryClient.invalidateQueries();
	}, [queryClient]);

	useEffect(() => {
		const unsubscribeImport = window.electronAPI.importExport.onImportComplete((result) => {
			if (result.success) {
				invalidateAllQueries();
			}

			onImportComplete?.(result);
		});

		const unsubscribeExport = window.electronAPI.importExport.onExportComplete((result) => {
			onExportComplete?.(result);
		});

		return () => {
			unsubscribeImport();
			unsubscribeExport();
		};
	}, [queryClient, onImportComplete, onExportComplete, invalidateAllQueries]);

	return { invalidateAllQueries };
}
