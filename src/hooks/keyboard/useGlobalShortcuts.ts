import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { AppPage } from "../../renderer/components/layout/AppBar";

/**
 * hook for global app shortcuts (f1-f5 for tabs)
 */
export function useGlobalShortcuts(onPageChange: (page: AppPage) => void) {
	useKeyboardShortcuts(
		{
			F1: () => onPageChange("domu"),
			F2: () => onPageChange("novy_doklad"),
			F3: () => onPageChange("adresar"),
			F4: () => onPageChange("sklad"),
			'F5': () => onPageChange('doklady'),
			// 'F6': () => onPageChange(''),
		},
		{
			preventInInputs: false, // tab switching when in inputs
			preventDefault: true,
		},
	);
}
