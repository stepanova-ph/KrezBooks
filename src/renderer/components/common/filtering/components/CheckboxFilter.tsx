// filters/CheckboxFilter.tsx
import { FormControlLabel } from "@mui/material";
import { KeyboardCheckbox } from "../../inputs/KeyboardCheckbox";
import type { CheckboxFilterDef } from "src/types/filter";

interface CheckboxFilterProps {
	filter: CheckboxFilterDef;
	value: boolean;
	onUpdate: (value: boolean) => void;
	canUncheck: boolean;
}

export function CheckboxFilter({
	filter,
	value,
	onUpdate,
	canUncheck,
}: CheckboxFilterProps) {
	const checked = !!value;

	return (
		<FormControlLabel
			sx={{
				color: (theme) =>
					checked ? theme.palette.primary.main : theme.palette.text.secondary,
			}}
			key={filter.id}
			control={
				<KeyboardCheckbox
					checked={checked}
					onChange={(e) => {
						if (!e.target.checked && !canUncheck) return;
						onUpdate(e.target.checked);
					}}
				/>
			}
			label={filter.label}
		/>
	);
}
