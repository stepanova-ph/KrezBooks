import { useEffect } from "react";

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
	options: UseKeyboardShortcutsOptions = {},
) {
	const {
		disabled = false,
		preventInInputs = true,
		preventDefault = true,
	} = options;

	useEffect(() => {
		if (disabled) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (preventInInputs) {
				const target = event.target as HTMLElement;
				const isInput =
					target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.contentEditable === "true";

				if (isInput) return;
			}

			const handler = shortcuts[event.key];

			if (handler) {
				if (preventDefault) {
					event.preventDefault();
				}
				handler();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [shortcuts, disabled, preventInInputs, preventDefault]);
}
