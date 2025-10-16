import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Item, CreateItemInput, UpdateItemInput } from "../types/database";

export const itemKeys = {
  all: ["items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  list: (filters?: any) => [...itemKeys.lists(), { filters }] as const,
  details: () => [...itemKeys.all, "detail"] as const,
  detail: (id: number) => [...itemKeys.details(), id] as const,
};

export function useItems() {
  return useQuery({
    queryKey: itemKeys.lists(),
    queryFn: async () => {
      const items = await window.electronAPI.items.getAll();
      return items as Item[];
    },
  });
}

export function useItem(id: number) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: async () => {
      const item = await window.electronAPI.items.getOne(id);
      return item as Item;
    },
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateItemInput) => {
      return await window.electronAPI.items.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateItemInput) => {
      const { id, ...updateData } = data;
      return await window.electronAPI.items.update(id, updateData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: itemKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await window.electronAPI.items.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}
