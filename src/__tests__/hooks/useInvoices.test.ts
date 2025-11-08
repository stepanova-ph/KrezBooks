import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
	useInvoices,
	useInvoice,
	useCreateInvoice,
	useUpdateInvoice,
	useDeleteInvoice,
} from "../../../src/hooks/useInvoices";
import { createWrapper, mockElectronAPI } from "./hooks-test-setup";
import type { Invoice, CreateInvoiceInput } from "../../../src/types/database";

describe("useInvoices", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("useInvoices", () => {
		it("fetches all invoices successfully", async () => {
			const mockInvoices: Invoice[] = [
				{
					number: "INV-001",
					type: 1,
					payment_method: null,
					date_issue: "2024-01-15",
					date_tax: null,
					date_due: null,
					variable_symbol: null,
					note: null,
					ico: "12345678",
					modifier: 1,
					dic: null,
					company_name: "Test Company",
					street: null,
					city: null,
					postal_code: null,
					phone: null,
					email: null,
					bank_account: null,
				},
			];

			mockElectronAPI.invoices.getAll.mockResolvedValue({
				success: true,
				data: mockInvoices,
			});

			const { result } = renderHook(() => useInvoices(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toEqual(mockInvoices);
			expect(mockElectronAPI.invoices.getAll).toHaveBeenCalledTimes(1);
		});

		it("handles fetch error", async () => {
			mockElectronAPI.invoices.getAll.mockResolvedValue({
				success: false,
				error: "Database error",
			});

			const { result } = renderHook(() => useInvoices(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});

	describe("useInvoice", () => {
		it("fetches single invoice successfully", async () => {
			const mockInvoice: Invoice = {
				number: "INV-001",
				type: 1,
				payment_method: 1,
				date_issue: "2024-01-15",
				date_tax: "2024-01-15",
				date_due: "2024-02-15",
				variable_symbol: "123456",
				note: "Test note",
				ico: "12345678",
				modifier: 1,
				dic: "CZ12345678",
				company_name: "Test Company",
				street: "123 Main St",
				city: "Prague",
				postal_code: "110 00",
				phone: "+420123456789",
				email: "test@example.com",
				bank_account: "1234567890/0100",
			};

			mockElectronAPI.invoices.getOne.mockResolvedValue({
				success: true,
				data: mockInvoice,
			});

			const { result } = renderHook(() => useInvoice("INV-001"), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toEqual(mockInvoice);
			expect(mockElectronAPI.invoices.getOne).toHaveBeenCalledWith("INV-001");
		});

		it("does not fetch when number is empty", () => {
			const { result } = renderHook(() => useInvoice(""), {
				wrapper: createWrapper(),
			});

			expect(result.current.fetchStatus).toBe("idle");
			expect(mockElectronAPI.invoices.getOne).not.toHaveBeenCalled();
		});
	});

	describe("useCreateInvoice", () => {
		it("creates invoice successfully", async () => {
			const newInvoice: CreateInvoiceInput = {
				number: "INV-002",
				type: 1,
				date_issue: "2024-01-20",
				ico: "12345678",
				modifier: 1,
			};

			mockElectronAPI.invoices.create.mockResolvedValue({
				success: true,
				data: { changes: 1 },
			});

			const { result } = renderHook(() => useCreateInvoice(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(newInvoice);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockElectronAPI.invoices.create).toHaveBeenCalledWith(newInvoice);
			expect(result.current.data).toEqual({ changes: 1 });
		});

		it("creates invoice with all optional fields", async () => {
			const fullInvoice: CreateInvoiceInput = {
				number: "INV-003",
				type: 2,
				payment_method: 1,
				date_issue: "2024-01-20",
				date_tax: "2024-01-20",
				date_due: "2024-02-20",
				variable_symbol: "654321",
				note: "Full invoice",
				ico: "12345678",
				modifier: 1,
			};

			mockElectronAPI.invoices.create.mockResolvedValue({
				success: true,
				data: { changes: 1 },
			});

			const { result } = renderHook(() => useCreateInvoice(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(fullInvoice);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockElectronAPI.invoices.create).toHaveBeenCalledWith(fullInvoice);
		});

		it("handles create error", async () => {
			const newInvoice: CreateInvoiceInput = {
				number: "INV-002",
				type: 1,
				date_issue: "2024-01-20",
				ico: "12345678",
				modifier: 1,
			};

			mockElectronAPI.invoices.create.mockResolvedValue({
				success: false,
				error: "Duplicate invoice number",
			});

			const { result } = renderHook(() => useCreateInvoice(), {
				wrapper: createWrapper(),
			});

			result.current.mutate(newInvoice);

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});

	describe("useUpdateInvoice", () => {
		it("updates invoice successfully", async () => {
			const updates = {
				note: "Updated note",
				variable_symbol: "999999",
			};

			mockElectronAPI.invoices.update.mockResolvedValue({
				success: true,
				data: { changes: 1 },
			});

			const { result } = renderHook(() => useUpdateInvoice(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				number: "INV-001",
				updates,
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockElectronAPI.invoices.update).toHaveBeenCalledWith(
				"INV-001",
				updates,
			);
		});

		it("handles update error", async () => {
			mockElectronAPI.invoices.update.mockResolvedValue({
				success: false,
				error: "Invoice not found",
			});

			const { result } = renderHook(() => useUpdateInvoice(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				number: "INV-999",
				updates: { note: "Updated" },
			});

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});

	describe("useDeleteInvoice", () => {
		it("deletes invoice successfully", async () => {
			mockElectronAPI.invoices.delete.mockResolvedValue({
				success: true,
				data: { changes: 1 },
			});

			const { result } = renderHook(() => useDeleteInvoice(), {
				wrapper: createWrapper(),
			});

			result.current.mutate("INV-001");

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockElectronAPI.invoices.delete).toHaveBeenCalledWith("INV-001");
			expect(result.current.data).toEqual({ changes: 1 });
		});

		it("handles delete error", async () => {
			mockElectronAPI.invoices.delete.mockResolvedValue({
				success: false,
				error: "Invoice not found",
			});

			const { result } = renderHook(() => useDeleteInvoice(), {
				wrapper: createWrapper(),
			});

			result.current.mutate("INV-999");

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});
});
