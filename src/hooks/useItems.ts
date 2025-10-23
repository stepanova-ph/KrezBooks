import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Item, CreateItemInput, UpdateItemInput } from '../types/database';

export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters?: any) => [...itemKeys.lists(), { filters }] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (ean: string) => [...itemKeys.details(), ean] as const,
};

export function useItems() {
  return useQuery({
    queryKey: itemKeys.lists(),
    queryFn: async () => {
      const response = await window.electronAPI.items.getAll();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch items');
      }
      return response.data || [];
    },
  });
}

export function useItem(ean: string) {
  return useQuery({
    queryKey: itemKeys.detail(ean),
    queryFn: async () => {
      const response = await window.electronAPI.items.getOne(ean);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch item');
      }
      return response.data;
    },
    enabled: !!ean,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateItemInput) => {
      const response = await window.electronAPI.items.create(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create item');
      }
      return response.data;
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
      const { ean, ...updateData } = data;
      const response = await window.electronAPI.items.update(ean, updateData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update item');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(variables.ean) });
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ean: string) => {
      const response = await window.electronAPI.items.delete(ean);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete item');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useItemCategories() {
  return useQuery({
    queryKey: [...itemKeys.all, 'categories'],
queryFn: async () => {
  try {
    const response = await window.electronAPI.items.getCategories();
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch categories');
    }
    return response.data || [];
  } catch (err) {
    console.error("ERROR in useItemCategories:", err);
    throw err;
  }
},
  });
}