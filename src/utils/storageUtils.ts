/**
 * Storage keys for localStorage
 */
export const ORDER_STORAGE_KEYS = {
  COLUMN_ORDER_CONTACTS: 'krezbooks_columnOrder_contacts',
  COLUMN_ORDER_INVENTORY: 'krezbooks_columnOrder_inventory',
  COLUMN_ORDER_INVOICES: 'krezbooks_columnOrder_invoices',
} as const;

/**
 * Storage utility for managing localStorage
 */
export const storage = {
  /**
   * Get item from localStorage
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue ?? null;
      return JSON.parse(item) as T;
    } catch (e) {
      console.error(`Failed to get item from localStorage (${key}):`, e);
      return defaultValue ?? null;
    }
  },

  /**
   * Set item in localStorage
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to set item in localStorage (${key}):`, e);
    }
  },

  /**
   * Remove item from localStorage
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove item from localStorage (${key}):`, e);
    }
  },

  /**
   * Clear all app data from localStorage
   */
  clearAll(): void {
    try {
      Object.values(ORDER_STORAGE_KEYS).forEach((key) => {
        if (typeof key === 'string') {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  },

  /**
   * Clear all tab states (session data)
   */
  clearTabStates(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(ORDER_STORAGE_KEYS.TAB_STATE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Failed to clear tab states:', e);
    }
  },
};