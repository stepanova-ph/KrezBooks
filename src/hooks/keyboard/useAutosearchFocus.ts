import { useEffect, RefObject } from 'react';
import { FilterBarRef } from '../../renderer/components/common/filtering/FilterBar';

export interface UseAutoSearchFocusOptions {
  filterBarRef?: RefObject<FilterBarRef>;
  inputRef?: RefObject<HTMLInputElement>;
  disabled?: boolean;
}

/**
 * hook for auto-focusing a search input when user types
 * triggers on alphanumeric keys and +
 * 
 * Supports two modes:
 * 1. filterBarRef - for use with FilterBar component
 * 2. inputRef - for direct input ref (like in dialogs)
 */
export function useAutoSearchFocus(options: UseAutoSearchFocusOptions) {
  const { filterBarRef, inputRef, disabled = false } = options;

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

      if (isAlphanumeric) {
        // Try direct input ref first
        if (inputRef?.current) {
          inputRef.current.focus();
        } 
        // Fall back to FilterBar ref
        else if (filterBarRef?.current?.searchInputRef.current) {
          filterBarRef.current.searchInputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filterBarRef, inputRef, disabled]);
}