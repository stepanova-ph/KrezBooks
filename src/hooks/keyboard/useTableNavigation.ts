import { useState, useEffect, useCallback, useRef } from 'react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

export interface UseTableNavigationOptions {
  disabled?: boolean;
  dataLength: number;
  onFocusChange?: (index: number) => void;
}

/**
 * hook for table row navigation with arrow keys
 * manages focused row index and provides auto-scroll
 */
export function useTableNavigation(options: UseTableNavigationOptions) {
  const { disabled = false, dataLength, onFocusChange } = options;
  
  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  // reset focused index if data changes
  useEffect(() => {
    if (focusedRowIndex >= dataLength && dataLength > 0) {
      setFocusedRowIndex(dataLength - 1);
    }
  }, [dataLength, focusedRowIndex]);

  // auto-scroll to focused row
  useEffect(() => {
    if (rowRefs.current[focusedRowIndex]) {
      rowRefs.current[focusedRowIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [focusedRowIndex]);

  // notify parent when focus changes
  useEffect(() => {
    onFocusChange?.(focusedRowIndex);
  }, [focusedRowIndex, onFocusChange]);

  const moveUp = useCallback(() => {
    setFocusedRowIndex(prev => Math.max(0, prev - 1));
  }, []);

  const moveDown = useCallback(() => {
    setFocusedRowIndex(prev => Math.min(dataLength - 1, prev + 1));
  }, [dataLength]);

  const movePageUp = useCallback(() => {
    setFocusedRowIndex(prev => Math.max(0, prev - 10));
  }, []);

  const movePageDown = useCallback(() => {
    setFocusedRowIndex(prev => Math.min(dataLength - 1, prev + 10));
  }, [dataLength]);

  const moveToTop = useCallback(() => {
    setFocusedRowIndex(0);
  }, []);

  const moveToBottom = useCallback(() => {
    setFocusedRowIndex(dataLength - 1);
  }, [dataLength]);

  useKeyboardShortcuts({
    'ArrowUp': moveUp,
    'ArrowDown': moveDown,
    'PageUp': movePageUp,
    'PageDown': movePageDown,
    'Home': moveToTop,
    'End': moveToBottom,
  }, {
    disabled: disabled || dataLength === 0,
    preventInInputs: true,
  });

  const setRowRef = useCallback((index: number) => {
    return (el: HTMLTableRowElement | null) => {
      rowRefs.current[index] = el;
    };
  }, []);

  return {
    focusedRowIndex,
    setFocusedRowIndex, // expose this for mouse interactions
    setRowRef,
  };
}