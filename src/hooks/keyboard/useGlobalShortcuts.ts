import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { AppPage } from '../../renderer/components/layout/AppBar';

/**
 * hook for global app shortcuts (f1-f5 for tabs)
 */
export function useGlobalShortcuts(onPageChange: (page: AppPage) => void) {
  useKeyboardShortcuts({
    'F1': () => onPageChange('domu'),
    'F2': () => onPageChange('adresar'),
    'F3': () => onPageChange('sklad'),
    'F4': () => onPageChange('ucetnictvi'),
    // 'F5': () => onPageChange(''),
    // 'F6': () => onPageChange(''),
  }, {
    preventInInputs: false, // tab switching when in inputs
    preventDefault: true,
  });
}