// filters/TextSearchFilter.tsx
import { TextField } from "@mui/material";
import type { TextSearchFilterDef } from "src/types/filter";

interface TextSearchFilterProps {
	filter: TextSearchFilterDef;
	value: string;
	onUpdate: (value: string) => void;
	searchInputRef?: React.RefObject<HTMLInputElement>;
}

export function TextSearchFilter({ 
	filter, 
	value, 
	onUpdate,
	searchInputRef 
}: TextSearchFilterProps) {
	return (
		<TextField
			key={filter.id}
			size="small"
			label={filter.label}
			value={value || ""}
			onChange={(e) => onUpdate(e.target.value)}
			inputRef={filter.id === "search" ? searchInputRef : undefined}
			sx={{ minWidth: filter.width || 250 }}
		/>
	);
}