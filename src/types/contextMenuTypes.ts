import { ReactNode } from "react";

/**
 * Context menu action definition
 */
export type ContextMenuAction<T = any> = {
	id: string;
	label: string;
	icon?: ReactNode;
	onClick: (item: T) => void | Promise<void>;
	requireConfirm?: boolean;
	confirmMessage?: string | ((item: T) => string);
	divider?: boolean;
};
