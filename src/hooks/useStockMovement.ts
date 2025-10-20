import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { 
  StockMovement, 
  CreateStockMovementInput 
} from "../types/database";

export function useStockMovements() {
  return useQuery({
    queryKey: ["stockMovements"],
    queryFn: async () => {
      const result = await window.electronAPI.db.stockMovements.getAll();
      if (!result.success) throw new Error(result.error);
      return result.data as StockMovement[];
    },
  });
}

export function useStockMovementsByInvoice(invoiceNumber: string) {
  return useQuery({
    queryKey: ["stockMovements", "invoice", invoiceNumber],
    queryFn: async () => {
      const result = await window.electronAPI.db.stockMovements.getByInvoice(invoiceNumber);
      if (!result.success) throw new Error(result.error);
      return result.data as StockMovement[];
    },
    enabled: !!invoiceNumber,
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (movement: CreateStockMovementInput) => {
      const result = await window.electronAPI.db.stockMovements.create(movement);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
    },
  });
}

export function useUpdateStockMovement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      invoiceNumber, 
      itemEan, 
      updates 
    }: { 
      invoiceNumber: string; 
      itemEan: string; 
      updates: Partial<StockMovement> 
    }) => {
      const result = await window.electronAPI.db.stockMovements.update(
        invoiceNumber, 
        itemEan, 
        updates
      );
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
    },
  });
}

export function useDeleteStockMovement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      invoiceNumber, 
      itemEan 
    }: { 
      invoiceNumber: string; 
      itemEan: string; 
    }) => {
      const result = await window.electronAPI.db.stockMovements.delete(invoiceNumber, itemEan);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
    },
  });
}