import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useContacts,
  useContact,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from '../../../src/hooks/useContacts';
import { createWrapper, mockElectronAPI } from './hooks-test-setup';
import type { Contact, CreateContactInput, UpdateContactInput } from '../../../src/types/database';

describe('useContacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useContacts', () => {
    it('fetches all contacts successfully', async () => {
      const mockContacts: Contact[] = [
        {
          ico: '12345678',
          modifier: 1,
          company_name: 'Test Company',
          is_supplier: true,
          is_customer: false,
          price_group: 1,
          dic: null,
          street: null,
          city: null,
          postal_code: null,
          phone: null,
          email: null,
          bank_account: null,
        },
      ];

      mockElectronAPI.contacts.getAll.mockResolvedValue({
        success: true,
        data: mockContacts,
      });

      const { result } = renderHook(() => useContacts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockContacts);
      expect(mockElectronAPI.contacts.getAll).toHaveBeenCalledTimes(1);
    });

    it('handles fetch error', async () => {
      mockElectronAPI.contacts.getAll.mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      const { result } = renderHook(() => useContacts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });

    it('returns empty array when no contacts exist', async () => {
      mockElectronAPI.contacts.getAll.mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useContacts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useContact', () => {
    it('fetches single contact successfully', async () => {
      const mockContact: Contact = {
        ico: '12345678',
        modifier: 1,
        company_name: 'Test Company',
        is_supplier: true,
        is_customer: false,
        price_group: 1,
        dic: null,
        street: null,
        city: null,
        postal_code: null,
        phone: null,
        email: null,
        bank_account: null,
      };

      mockElectronAPI.contacts.getOne.mockResolvedValue({
        success: true,
        data: mockContact,
      });

      const { result } = renderHook(
        () => useContact('12345678', 1),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockContact);
      expect(mockElectronAPI.contacts.getOne).toHaveBeenCalledWith('12345678', 1);
    });

    it('does not fetch when ico or modifier is missing', () => {
      const { result } = renderHook(
        () => useContact('', 0),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockElectronAPI.contacts.getOne).not.toHaveBeenCalled();
    });
  });

  describe('useCreateContact', () => {
    it('creates contact successfully', async () => {
      const newContact: CreateContactInput = {
        ico: '87654321',
        modifier: 1,
        company_name: 'New Company',
        is_supplier: false,
        is_customer: true,
        price_group: 2,
      };

      mockElectronAPI.contacts.create.mockResolvedValue({
        success: true,
        data: { changes: 1 },
      });

      const { result } = renderHook(() => useCreateContact(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newContact);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockElectronAPI.contacts.create).toHaveBeenCalledWith(newContact);
      expect(result.current.data).toEqual({ changes: 1 });
    });

    it('handles create error', async () => {
      const newContact: CreateContactInput = {
        ico: '87654321',
        modifier: 1,
        company_name: 'New Company',
        is_supplier: false,
        is_customer: true,
        price_group: 2,
      };

      mockElectronAPI.contacts.create.mockResolvedValue({
        success: false,
        error: 'Duplicate ICO',
      });

      const { result } = renderHook(() => useCreateContact(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newContact);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useUpdateContact', () => {
    it('updates contact successfully', async () => {
      const updateData: UpdateContactInput = {
        ico: '12345678',
        modifier: 1,
        company_name: 'Updated Company',
      };

      mockElectronAPI.contacts.update.mockResolvedValue({
        success: true,
        data: { changes: 1 },
      });

      const { result } = renderHook(() => useUpdateContact(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(updateData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockElectronAPI.contacts.update).toHaveBeenCalledWith(
        '12345678',
        1,
        { company_name: 'Updated Company' }
      );
    });
  });

  describe('useDeleteContact', () => {
    it('deletes contact successfully', async () => {
      mockElectronAPI.contacts.delete.mockResolvedValue({
        success: true,
        data: { changes: 1 },
      });

      const { result } = renderHook(() => useDeleteContact(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ ico: '12345678', modifier: 1 });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockElectronAPI.contacts.delete).toHaveBeenCalledWith('12345678', 1);
      expect(result.current.data).toEqual({ changes: 1 });
    });

    it('handles delete error', async () => {
      mockElectronAPI.contacts.delete.mockResolvedValue({
        success: false,
        error: 'Contact not found',
      });

      const { result } = renderHook(() => useDeleteContact(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ ico: '12345678', modifier: 1 });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });
});