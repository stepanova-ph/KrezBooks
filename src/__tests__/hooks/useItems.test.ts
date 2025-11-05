import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useItems,
  useItem,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useItemCategories,
} from '../../hooks/useItems';
import { createWrapper, mockElectronAPI } from './hooks-test-setup';
import type { Item, CreateItemInput, UpdateItemInput } from '../../types/database';

describe('useItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useItems', () => {
    it('fetches all items successfully', async () => {
      const mockItems: Item[] = [
        {
          ean: '1234567890123',
          name: 'Test Item',
          vat_rate: 2,
          unit_of_measure: 'ks',
          sale_price_group1: 100,
          sale_price_group2: 90,
          sale_price_group3: 80,
          sale_price_group4: 70,
          category: null,
          note: null,
        },
      ];

      mockElectronAPI.items.getAll.mockResolvedValue({
        success: true,
        data: mockItems,
      });

      const { result } = renderHook(() => useItems(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockItems);
      expect(mockElectronAPI.items.getAll).toHaveBeenCalledTimes(1);
    });

    it('handles fetch error', async () => {
      mockElectronAPI.items.getAll.mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      const { result } = renderHook(() => useItems(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });

    it('returns empty array when no items exist', async () => {
      mockElectronAPI.items.getAll.mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useItems(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useItem', () => {
    it('fetches single item successfully', async () => {
      const mockItem: Item = {
        ean: '1234567890123',
        name: 'Test Item',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 100,
        sale_price_group2: 90,
        sale_price_group3: 80,
        sale_price_group4: 70,
        category: 'Electronics',
        note: 'Test note',
      };

      mockElectronAPI.items.getOne.mockResolvedValue({
        success: true,
        data: mockItem,
      });

      const { result } = renderHook(
        () => useItem('1234567890123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockItem);
      expect(mockElectronAPI.items.getOne).toHaveBeenCalledWith('1234567890123');
    });

    it('does not fetch when ean is empty', () => {
      const { result } = renderHook(
        () => useItem(''),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockElectronAPI.items.getOne).not.toHaveBeenCalled();
    });
  });

  describe('useCreateItem', () => {
    it('creates item successfully', async () => {
      const newItem: CreateItemInput = {
        ean: '9876543210987',
        name: 'New Item',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 150,
        sale_price_group2: 140,
        sale_price_group3: 130,
        sale_price_group4: 120,
      };

      mockElectronAPI.items.create.mockResolvedValue({
        success: true,
        data: { changes: 1 },
      });

      const { result } = renderHook(() => useCreateItem(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newItem);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockElectronAPI.items.create).toHaveBeenCalledWith(newItem);
      expect(result.current.data).toEqual({ changes: 1 });
    });

    it('handles create error', async () => {
      const newItem: CreateItemInput = {
        ean: '9876543210987',
        name: 'New Item',
        vat_rate: 2,
        unit_of_measure: 'ks',
        sale_price_group1: 150,
        sale_price_group2: 140,
        sale_price_group3: 130,
        sale_price_group4: 120,
      };

      mockElectronAPI.items.create.mockResolvedValue({
        success: false,
        error: 'Duplicate EAN',
      });

      const { result } = renderHook(() => useCreateItem(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newItem);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useUpdateItem', () => {
    it('updates item successfully', async () => {
      const updateData: UpdateItemInput = {
        ean: '1234567890123',
        name: 'Updated Item',
        sale_price_group1: 200,
      };

      mockElectronAPI.items.update.mockResolvedValue({
        success: true,
        data: { changes: 1 },
      });

      const { result } = renderHook(() => useUpdateItem(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(updateData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockElectronAPI.items.update).toHaveBeenCalledWith(
        '1234567890123',
        { name: 'Updated Item', sale_price_group1: 200 }
      );
    });

    it('handles update error', async () => {
      const updateData: UpdateItemInput = {
        ean: '1234567890123',
        name: 'Updated Item',
      };

      mockElectronAPI.items.update.mockResolvedValue({
        success: false,
        error: 'Item not found',
      });

      const { result } = renderHook(() => useUpdateItem(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(updateData);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useDeleteItem', () => {
    it('deletes item successfully', async () => {
      mockElectronAPI.items.delete.mockResolvedValue({
        success: true,
        data: { changes: 1 },
      });

      const { result } = renderHook(() => useDeleteItem(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1234567890123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockElectronAPI.items.delete).toHaveBeenCalledWith('1234567890123');
      expect(result.current.data).toEqual({ changes: 1 });
    });

    it('handles delete error', async () => {
      mockElectronAPI.items.delete.mockResolvedValue({
        success: false,
        error: 'Item not found',
      });

      const { result } = renderHook(() => useDeleteItem(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1234567890123');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useItemCategories', () => {
    it('fetches categories successfully', async () => {
      const mockCategories = ['Electronics', 'Food', 'Clothing'];

      mockElectronAPI.items.getCategories.mockResolvedValue({
        success: true,
        data: mockCategories,
      });

      const { result } = renderHook(() => useItemCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCategories);
      expect(mockElectronAPI.items.getCategories).toHaveBeenCalledTimes(1);
    });

    it('handles categories fetch error', async () => {
      mockElectronAPI.items.getCategories.mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      const { result } = renderHook(() => useItemCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });

    it('returns empty array when no categories exist', async () => {
      mockElectronAPI.items.getCategories.mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useItemCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });
});