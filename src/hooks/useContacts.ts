import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Contact, CreateContactInput, UpdateContactInput } from '../types/database';

export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (filters?: any) => [...contactKeys.lists(), { filters }] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (ico: string, modifier: number) => 
    [...contactKeys.details(), ico, modifier] as const,
};

export function useContacts() {
  return useQuery({
    queryKey: contactKeys.lists(),
    queryFn: async () => {
      const contacts = await window.electronAPI.contacts.getAll();
      return contacts as Contact[];
    },
  });
}

export function useContact(ico: string, modifier: number) {
  return useQuery({
    queryKey: contactKeys.detail(ico, modifier),
    queryFn: async () => {
      const contact = await window.electronAPI.contacts.getOne(ico, modifier);
      return contact as Contact;
    },
    enabled: !!(ico && modifier !== undefined),
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateContactInput) => {
      return await window.electronAPI.contacts.create(data);
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
      return await window.electronAPI.contacts.update(ico, modifier, updateData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: contactKeys.detail(variables.ico, variables.modifier) 
      });
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ico, modifier }: { ico: string; modifier: number }) => {
      return await window.electronAPI.contacts.delete(ico, modifier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
}