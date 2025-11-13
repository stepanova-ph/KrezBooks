// filters/SelectFilter.tsx
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import type { SelectFilterDef } from "src/types/filter";

interface SelectFilterProps {
	filter: SelectFilterDef;
	value: string | number | null;
	onUpdate: (value: string | number | null) => void;
}

export function SelectFilter({ 
	filter, 
	value, 
	onUpdate 
}: SelectFilterProps) {
	return (
		<FormControl
			key={filter.id}
			size="small"
			sx={{ minWidth: filter.width || 180 }}
		>
			<InputLabel>{filter.label}</InputLabel>
			<Select
				value={value ?? ""}
				label={filter.label}
				onChange={(e: SelectChangeEvent) =>
					onUpdate(e.target.value || null)
				}
			>
				<MenuItem value="">
					<em>{filter.placeholder || "Vše"}</em>
				</MenuItem>
				{filter.options.map((option: any) => (
					<MenuItem key={option.value} value={option.value}>
						{option.label}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}