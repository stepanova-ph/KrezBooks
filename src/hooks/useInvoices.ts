import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Invoice, CreateInvoiceInput } from "../types/database";

export function useInvoices() {
	return useQuery({
		queryKey: ["invoices"],
		queryFn: async () => {
			const result = await window.electronAPI.invoices.getAll();
			if (!result.success) throw new Error(result.error);
			return result.data as Invoice[];
		},
	});
}

export function useInvoice(number: string) {
	return useQuery({
		queryKey: ["invoices", number],
		queryFn: async () => {
			const result = await window.electronAPI.invoices.getOne(number);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		enabled: !!number,
	});
}

export function useCreateInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (invoice: CreateInvoiceInput) => {
			const result = await window.electronAPI.invoices.create(invoice);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
		},
	});
}

export function useUpdateInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			number,
			updates,
		}: {
			number: string;
			updates: Partial<Invoice>;
		}) => {
			const result = await window.electronAPI.invoices.update(number, updates);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
		},
	});
}

export function useDeleteInvoice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (number: string) => {
			const result = await window.electronAPI.invoices.delete(number);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
		},
	});
}

/**
 * Hook to get the maximum invoice number for a specific type
 * Used for auto-incrementing invoice numbers in the form
 */
export function useMaxInvoiceNumber(type: number) {
	return useQuery({
		queryKey: ['invoices', 'maxNumber', type],
		queryFn: () => window.api.invoice.getMaxNumber(type),
		staleTime: 0, // Always fetch fresh to avoid duplicate numbers
		enabled: type >= 1 && type <= 5, // Only fetch for valid invoice types
	});
}
