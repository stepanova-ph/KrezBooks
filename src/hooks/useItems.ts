import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Item, CreateItemInput, UpdateItemInput } from '../types/database';

export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters?: any) => [...itemKeys.lists(), { filters }] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: number) => [...itemKeys.details(), id] as const,
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

export function useItem(id: number) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: async () => {
      const response = await window.electronAPI.items.getOne(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch item');
      }
      return response.data;
    },
    enabled: !!id,
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
      const { id, ...updateData } = data;
      const response = await window.electronAPI.items.update(id, updateData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update item');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await window.electronAPI.items.delete(id);
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