import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	StockMovement,
	CreateStockMovementInput,
	StockMovementWithInvoiceInfo,
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

export function useStockMovementsByInvoice(
	invoicePrefix: string,
	invoiceNumber: string,
) {
	return useQuery({
		queryKey: ["stockMovements", "invoice", invoicePrefix, invoiceNumber],
		queryFn: async () => {
			const result = await window.electronAPI.stockMovements.getByInvoice(
				invoicePrefix,
				invoiceNumber,
			);
			if (!result.success) throw new Error(result.error);
			return result.data as StockMovement[];
		},
		enabled: !!invoicePrefix && !!invoiceNumber,
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
			invoicePrefix,
			invoiceNumber,
			itemEan,
			updates,
		}: {
			invoicePrefix: string;
			invoiceNumber: string;
			itemEan: string;
			updates: Partial<StockMovement>;
		}) => {
			const result = await window.electronAPI.stockMovements.update(
				invoicePrefix,
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
			invoicePrefix,
			invoiceNumber,
			itemEan,
		}: {
			invoicePrefix: string;
			invoiceNumber: string;
			itemEan: string;
		}) => {
			const result = await window.electronAPI.stockMovements.delete(
				invoicePrefix,
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

export function useStockMovementsByItem(itemEan: string) {
	return useQuery({
		queryKey: ["stockMovements", "item", itemEan],
		queryFn: async () => {
			const result =
				await window.electronAPI.stockMovements.getByItemWithInvoiceInfo(
					itemEan,
				);
			if (!result.success) throw new Error(result.error);
			return result.data as StockMovementWithInvoiceInfo[];
		},
		enabled: !!itemEan,
	});
}
