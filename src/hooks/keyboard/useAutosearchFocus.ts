import { useEffect, RefObject } from 'react';
import { FilterBarRef } from '../../renderer/components/common/FilterBar';

export interface UseAutoSearchFocusOptions {
  filterBarRef: RefObject<FilterBarRef>;
  disabled?: boolean;
}

/**
 * hook for auto-focusing search bar when user types
 * triggers on alphanumeric keys and +
 * 
 * FIXED: accepts the parent ref and accesses searchInputRef inside the effect
 */
export function useAutoSearchFocus(options: UseAutoSearchFocusOptions) {
  const { filterBarRef, disabled = false } = options;

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // skip if we're already in an input
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true';

      if (isInput) return;

      // skip if modifier keys are pressed
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      // check if it's alphanumeric or +
      const isAlphanumeric = /^[a-zA-Z0-9+]$/.test(event.key);

      // FIXED: access the nested ref inside the effect
      if (isAlphanumeric && filterBarRef.current?.searchInputRef.current) {
        filterBarRef.current.searchInputRef.current.focus();
        
        // let the character appear in the input
        // by not preventing default
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filterBarRef, disabled]);
}