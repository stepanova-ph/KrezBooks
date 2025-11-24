import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { vi } from "vitest";

export const mockElectronAPI = {
	contacts: {
		getAll: vi.fn(),
		getOne: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
	items: {
		getAll: vi.fn(),
		getOne: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		getCategories: vi.fn(),
	},
	invoices: {
		getAll: vi.fn(),
		getOne: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
	stockMovements: {
		getAll: vi.fn(),
		getByInvoice: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		getStockAmountByItem: vi.fn(),
	},
};

// @ts-ignore
global.window.electronAPI = mockElectronAPI;

export function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false, // Don't retry in tests
				gcTime: 0, // Disable caching
			},
			mutations: {
				retry: false,
			},
		},
	});
}

export function createWrapper() {
	const queryClient = createTestQueryClient();
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
