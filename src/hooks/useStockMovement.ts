import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	StockMovement,
	CreateStockMovementInput,
} from "../types/database";

export function useStockMovements() {
	return useQuery({
		queryKey: ["stockMovements"],
		queryFn: async () => {
			const result = await window.electronAPI.stockMovements.getAll();
			if (!result.success) throw new Error(result.error);
			return result.data as StockMovement[];
		},
	});
}

export function useStockMovementsByInvoice(invoiceNumber: string) {
	return useQuery({
		queryKey: ["stockMovements", "invoice", invoiceNumber],
		queryFn: async () => {
			const result =
				await window.electronAPI.stockMovements.getByInvoice(invoiceNumber);
			if (!result.success) throw new Error(result.error);
			return result.data as StockMovement[];
		},
		enabled: !!invoiceNumber,
	});
}

export function useCreateStockMovement() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (movement: CreateStockMovementInput) => {
			const result = await window.electronAPI.stockMovements.create(movement);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
		},
	});
}

export function useUpdateStockMovement() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			invoiceNumber,
			itemEan,
			updates,
		}: {
			invoiceNumber: string;
			itemEan: string;
			updates: Partial<StockMovement>;
		}) => {
			const result = await window.electronAPI.stockMovements.update(
				invoiceNumber,
				itemEan,
				updates,
			);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
		},
	});
}

export function useDeleteStockMovement() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			invoiceNumber,
			itemEan,
		}: {
			invoiceNumber: string;
			itemEan: string;
		}) => {
			const result = await window.electronAPI.stockMovements.delete(
				invoiceNumber,
				itemEan,
			);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
		},
	});
}

export function useStockAmountByItem(itemEan: string) {
	return useQuery({
		queryKey: ["stockMovements", "amount", itemEan],
		queryFn: async () => {
			const result =
				await window.electronAPI.stockMovements.getStockAmountByItem(itemEan);
			if (!result.success) throw new Error(result.error);
			return result.data as number;
		},
		enabled: !!itemEan,
	});
}

export function useAverageBuyPriceByItem(itemEan: string) {
	return useQuery({
		queryKey: ["stockMovements", "avgPrice", itemEan],
		queryFn: async () => {
			const result =
				await window.electronAPI.stockMovements.getAverageBuyPriceByItem(
					itemEan,
				);
			if (!result.success) throw new Error(result.error);
			return result.data as number;
		},
		enabled: !!itemEan,
	});
}

export function useLastBuyPriceByItem(itemEan: string) {
	return useQuery({
		queryKey: ["stockMovements", "lastPrice", itemEan],
		queryFn: async () => {
			const result =
				await window.electronAPI.stockMovements.getLastBuyPriceByItem(itemEan);
			if (!result.success) throw new Error(result.error);
			return result.data as number;
		},
		enabled: !!itemEan,
	});
}

export function useTotalByItemEanAndInvoiceNumber(itemEan: string, invoiceNumber: string) {
	return useQuery({
		queryKey: ["stockMovements", "total", itemEan, invoiceNumber],
		queryFn: async () => {
			const result =
				await window.electronAPI.stockMovements.getTotalByItemEanAndInvoiceNumber(
					itemEan,
					invoiceNumber,
				);
			if (!result.success) throw new Error(result.error);
			return result.data as number;
		},
		enabled: !!itemEan && !!invoiceNumber,
	});
}

export function useTotalByInvoiceNumber(invoiceNumber: string) {
	return useQuery({
		queryKey: ["stockMovements", "total", invoiceNumber],
		queryFn: async () => {
			const result =
				await window.electronAPI.stockMovements.getTotalByInvoiceNumber(
					invoiceNumber,
				);
			if (!result.success) throw new Error(result.error);
			return result.data as number;
		},
		enabled: !!invoiceNumber,
	});
}

export function useTotalByInvoiceNumberVat(invoiceNumber: string) {
	return useQuery({
		queryKey: ["stockMovements", "total", invoiceNumber],
		queryFn: async () => {
			const result =
				await window.electronAPI.stockMovements.getTotalByInvoiceNumberVat(
					invoiceNumber,
				);
			if (!result.success) throw new Error(result.error);
			return result.data as number;
		},
		enabled: !!invoiceNumber,
	});
}