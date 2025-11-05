import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { FilterState } from "../types/filter";
import type { InvoiceFormData, InvoiceItem } from "../hooks/useInvoiceForm";
import type { Contact } from "../types/database";

interface TabFilterStates {
  contacts: FilterState;
  inventory: FilterState;
  invoices: FilterState;
}

interface InvoiceFormState {
  formData: InvoiceFormData;
  invoiceItems: InvoiceItem[];
  selectedContact: Contact | null;
}

interface TabPersistenceContextValue {
  // Filter states
  getFilterState: (tab: keyof TabFilterStates) => FilterState | null;
  setFilterState: (tab: keyof TabFilterStates, state: FilterState) => void;
  
  // Invoice form state
  invoiceFormState: InvoiceFormState | null;
  setInvoiceFormState: (state: InvoiceFormState) => void;
  clearInvoiceFormState: () => void;
}

const TabPersistenceContext = createContext<TabPersistenceContextValue | null>(null);

interface TabPersistenceProviderProps {
  children: ReactNode;
}

export function TabPersistenceProvider({ children }: TabPersistenceProviderProps) {
  const [filterStates, setFilterStates] = useState<Partial<TabFilterStates>>({});
  const [invoiceFormState, setInvoiceFormState] = useState<InvoiceFormState | null>(null);

  const getFilterState = useCallback((tab: keyof TabFilterStates) => {
    return filterStates[tab] || null;
  }, [filterStates]);

  const setFilterState = useCallback((tab: keyof TabFilterStates, state: FilterState) => {
    setFilterStates((prev) => ({
      ...prev,
      [tab]: state,
    }));
  }, []);

  const clearInvoiceFormState = useCallback(() => {
    setInvoiceFormState(null);
  }, []);

  return (
    <TabPersistenceContext.Provider
      value={{
        getFilterState,
        setFilterState,
        invoiceFormState,
        setInvoiceFormState,
        clearInvoiceFormState,
      }}
    >
      {children}
    </TabPersistenceContext.Provider>
  );
}

export function useTabPersistence() {
  const context = useContext(TabPersistenceContext);
  if (!context) {
    throw new Error("useTabPersistence must be used within TabPersistenceProvider");
  }
  return context;
}