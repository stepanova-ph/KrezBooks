import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
	useStockMovements,
	useStockMovementsByInvoice,
	useCreateStockMovement,
	useUpdateStockMovement,
	useDeleteStockMovement,
	useStockAmountByItem,
} from "../../../src/hooks/useStockMovement";
import { createWrapper, mockElectronAPI } from "./hooks-test-setup";
import type {
	StockMovement,
	CreateStockMovementInput,
} from "../../../src/types/database";

describe("useStockMovement", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("useStockMovements", () => {
		it("fetches all stock movements successfully", async () => {
			const mockMovements: StockMovement[] = [
				{
					invoice_number: "INV-001",
					item_ean: "1234567890123",
					amount: 10,
					price: 100,
					type: 1,
				},
			];

			mockElectronAPI.stockMovements.getAll.mockResolvedValue({
				success: true,
				data: mockMovements,
			});

			const { result } = renderHook(() => useStockMovements(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toEqual(mockMovements);
			expect(mockElectronAPI.stockMovements.getAll).toHaveBeenCalledTimes(1);
		});

		it("handles fetch error", async () => {
			mockElectronAPI.stockMovements.getAll.mockResolvedValue({
				success: false,
				error: "Database error",
			});

			const { result } = renderHook(() => useStockMovements(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});

	describe("useStockMovementsByInvoice", () => {
		it("fetches movements for specific invoice", async () => {
			const mockMovements: StockMovement[] = [
				{
					invoice_number: "INV-001",
					item_ean: "1234567890123",
					amount: 10,
					price: 100,
					type: 1,
				},
				{
					invoice_number: "INV-001",
					item_ean: "9876543210987",
					amount: 5,
					price: 50,
					type: 1,
				},
			];

			mockElectronAPI.stockMovements.getByInvoice.mockResolvedValue({
				success: true,
				data: mockMovements,
			});

			const { result } = renderHook(
				() => useStockMovementsByInvoice("INV", "INV-001"),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toEqual(mockMovements);
			expect(mockElectronAPI.stockMovements.getByInvoice).toHaveBeenCalledWith(
				"INV", "INV-001",
			);
		});

		it("does not fetch when invoice number is empty", () => {
			const { result } = renderHook(() => useStockMovementsByInvoice("", ""), {
				wrapper: createWrapper(),
			});

			expect(result.current.fetchStatus).toBe("idle");
			expect(
				mockElectronAPI.stockMovements.getByInvoice,
			).not.toHaveBeenCalled();
		});

		it("returns empty array when invoice has no movements", async () => {
			mockElectronAPI.stockMovements.getByInvoice.mockResolvedValue({
				success: true,
				data: [],
			});

			const { result } = renderHook(
				() => useStockMovementsByInvoice("INV", "INV-002"),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toEqual([]);
		});
	});

	describe("useCreateStockMovement", () => {
		it("creates stock movement successfully", async () => {
			const newMovement: CreateStockMovementInput = {
				invoice_prefix: "INV",
				invoice_number: "INV-001",
				item_ean: "1234567890123",
				amount: 15,
				price: 150,
				type: 1,
			};

			mockElectronAPI.stockMovements.create.mockResolvedValue({
				success: true,
				data: { changes: 1 },
			});

			const { result } = renderHook(() => useCreateStockMovement(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(newMovement);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockElectronAPI.stockMovements.create).toHaveBeenCalledWith(
				newMovement,
			);
			expect(result.current.data).toEqual({ changes: 1 });
		});

		it("handles create error", async () => {
			const newMovement: CreateStockMovementInput = {
				invoice_prefix: "INV",
				invoice_number: "INV-001",
				item_ean: "1234567890123",
				amount: 15,
				price: 150,
				type: 1,
			};

			mockElectronAPI.stockMovements.create.mockResolvedValue({
				success: false,
				error: "Foreign key constraint failed",
			});

			const { result } = renderHook(() => useCreateStockMovement(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(newMovement);

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});

	describe("useUpdateStockMovement", () => {
		it("updates stock movement successfully", async () => {
			const updateData = {
				invoicePrefix: "INV",
				invoiceNumber: "INV-001",
				itemEan: "1234567890123",
				updates: {
					amount: 20,
					price: 200,
				},
			};

			mockElectronAPI.stockMovements.update.mockResolvedValue({
				success: true,
				data: { changes: 1 },
			});

			const { result } = renderHook(() => useUpdateStockMovement(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(updateData);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockElectronAPI.stockMovements.update).toHaveBeenCalledWith(
				"INV", "INV-001",
				"1234567890123",
				{ amount: 20, price: 200 },
			);
		});

		it("handles update error", async () => {
			const updateData = {
				invoicePrefix: "INV",
				invoiceNumber: "INV-999",
				itemEan: "1234567890123",
				updates: { amount: 20 },
			};

			mockElectronAPI.stockMovements.update.mockResolvedValue({
				success: false,
				error: "Movement not found",
			});

			const { result } = renderHook(() => useUpdateStockMovement(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(updateData);

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});

	describe("useDeleteStockMovement", () => {
		it("deletes stock movement successfully", async () => {
			mockElectronAPI.stockMovements.delete.mockResolvedValue({
				success: true,
				data: { changes: 1 },
			});

			const { result } = renderHook(() => useDeleteStockMovement(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				invoicePrefix: "INV",
				invoiceNumber: "INV-001",
				itemEan: "1234567890123",
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockElectronAPI.stockMovements.delete).toHaveBeenCalledWith(
				"INV", "INV-001",
				"1234567890123",
			);
		});

		it("handles delete error", async () => {
			mockElectronAPI.stockMovements.delete.mockResolvedValue({
				success: false,
				error: "Movement not found",
			});

			const { result } = renderHook(() => useDeleteStockMovement(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				invoicePrefix: "INV",
				invoiceNumber: "INV-999",
				itemEan: "1234567890123",
			});

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});

	describe("useStockAmountByItem", () => {
		it("fetches stock amount for specific item", async () => {
			mockElectronAPI.stockMovements.getStockAmountByItem.mockResolvedValue({
				success: true,
				data: 25,
			});

			const { result } = renderHook(
				() => useStockAmountByItem("1234567890123"),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toBe(25);
			expect(
				mockElectronAPI.stockMovements.getStockAmountByItem,
			).toHaveBeenCalledWith("1234567890123");
		});

		it("returns 0 when item has no stock movements", async () => {
			mockElectronAPI.stockMovements.getStockAmountByItem.mockResolvedValue({
				success: true,
				data: 0,
			});

			const { result } = renderHook(
				() => useStockAmountByItem("9999999999999"),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toBe(0);
		});

		it("handles fetch error", async () => {
			mockElectronAPI.stockMovements.getStockAmountByItem.mockResolvedValue({
				success: false,
				error: "Database error",
			});

			const { result } = renderHook(
				() => useStockAmountByItem("1234567890123"),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});
});
