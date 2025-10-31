import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	Contact,
	CreateContactInput,
	UpdateContactInput,
} from "../types/database";

export const contactKeys = {
	all: ["contacts"] as const,
	lists: () => [...contactKeys.all, "list"] as const,
	list: (filters?: any) => [...contactKeys.lists(), { filters }] as const,
	details: () => [...contactKeys.all, "detail"] as const,
	detail: (ico: string, modifier: number) =>
		[...contactKeys.details(), ico, modifier] as const,
};

export function useContacts() {
	return useQuery({
		queryKey: contactKeys.lists(),
		queryFn: async () => {
			const response = await window.electronAPI.contacts.getAll();
			if (!response.success) {
				throw new Error(response.error || "Failed to fetch contacts");
			}
			return response.data || [];
		},
	});
}

export function useContact(ico: string, modifier: number) {
	return useQuery({
		queryKey: contactKeys.detail(ico, modifier),
		queryFn: async () => {
			const response = await window.electronAPI.contacts.getOne(ico, modifier);
			if (!response.success) {
				throw new Error(response.error || "Failed to fetch contact");
			}
			return response.data;
		},
		enabled: !!(ico && modifier !== undefined),
	});
}

export function useCreateContact() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateContactInput) => {
			const response = await window.electronAPI.contacts.create(data);
			if (!response.success) {
				throw new Error(response.error || "Failed to create contact");
			}
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
		},
	});
}

export function useUpdateContact() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: UpdateContactInput) => {
			const { ico, modifier, ...updateData } = data;
			const response = await window.electronAPI.contacts.update(
				ico,
				modifier,
				updateData,
			);
			if (!response.success) {
				throw new Error(response.error || "Failed to update contact");
			}
			return response.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: contactKeys.detail(variables.ico, variables.modifier),
			});
			queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
		},
	});
}

export function useDeleteContact() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			ico,
			modifier,
		}: {
			ico: string;
			modifier: number;
		}) => {
			const response = await window.electronAPI.contacts.delete(ico, modifier);
			if (!response.success) {
				throw new Error(response.error || "Failed to delete contact");
			}
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
		},
	});
}
