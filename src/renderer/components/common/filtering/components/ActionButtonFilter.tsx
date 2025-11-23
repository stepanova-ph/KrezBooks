// filters/ActionButtonFilter.tsx
import { Button } from "@mui/material";
import type { ActionButtonFilterDef, FilterAction } from "src/types/filter";

interface ActionButtonFilterProps {
	filter: ActionButtonFilterDef;
	actions: FilterAction[];
	filterActions: FilterAction[];
	onOpenAction: (actionId: string) => void;
}

export function ActionButtonFilter({
	filter,
	actions,
	filterActions,
	onOpenAction,
}: ActionButtonFilterProps) {
	return (
		<Button
			key={filter.id}
			variant={filter.variant || "outlined"}
			size="small"
			onClick={() => {
				const action = [...filterActions, ...actions].find(
					(a) => a.id === filter.actionId,
				);
				if (action?.renderDialog) {
					onOpenAction(action.id);
				} else {
					action?.onClick?.();
				}
			}}
		>
			{filter.label}
		</Button>
	);
}
