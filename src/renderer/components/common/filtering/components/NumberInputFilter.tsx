// filters/NumberInputFilter.tsx
import { TextField } from "@mui/material";
import type { NumberInputFilterDef } from "src/types/filter";

interface NumberInputFilterProps {
	filter: NumberInputFilterDef;
	value: string;
	onUpdate: (value: string) => void;
}

export function NumberInputFilter({
	filter,
	value,
	onUpdate,
}: NumberInputFilterProps) {
	const validation = filter.validate ? filter.validate(value) : { valid: true };

	return (
		<TextField
			key={filter.id}
			size="small"
			label={filter.label}
			placeholder={filter.placeholder}
			value={value || ""}
			onChange={(e) => {
				const newValue = e.target.value.replace(/\D/g, "");
				if (filter.maxLength && newValue.length > filter.maxLength) return;
				onUpdate(newValue);
			}}
			error={!validation.valid}
			helperText={validation.error}
			sx={{ minWidth: filter.width || 150 }}
		/>
	);
}
