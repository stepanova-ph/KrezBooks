import { useEffect } from 'react';

export type KeyHandler = () => void;
export type KeyMap = Record<string, KeyHandler>;

export interface UseKeyboardShortcutsOptions {
  disabled?: boolean;
  preventInInputs?: boolean;
  preventDefault?: boolean;
}

/**
 * generic keyboard shortcuts hook
 * listens for keypresses and calls handlers
 */
export function useKeyboardShortcuts(
  shortcuts: KeyMap,
  options: UseKeyboardShortcutsOptions = {}
) {
  const {
    disabled = false,
    preventInInputs = true,
    preventDefault = true,
  } = options;

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // skip if we're in an input field and preventInInputs is true
      if (preventInInputs) {
        const target = event.target as HTMLElement;
        const isInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true';

        if (isInput) return;
      }

      // check if this key has a handler
      const handler = shortcuts[event.key];
      
      if (handler) {
        if (preventDefault) {
          event.preventDefault();
        }
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, disabled, preventInInputs, preventDefault]);
}