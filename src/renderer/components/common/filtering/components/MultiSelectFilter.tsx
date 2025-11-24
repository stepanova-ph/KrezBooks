import {
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	OutlinedInput,
	Chip,
	Box,
	SelectChangeEvent,
} from "@mui/material";
import { INVOICE_TYPES } from "../../../../../config/constants";
import type { MultiSelectFilterDef } from "../../../../../types/filter";

interface MultiSelectFilterProps {
	filter: MultiSelectFilterDef;
	value: any[];
	onUpdate: (value: any[]) => void;
}

export function MultiSelectFilter({
	filter,
	value,
	onUpdate,
}: MultiSelectFilterProps) {
	const selectedValues = value || [];

	return (
		<FormControl
			key={filter.id}
			size="small"
			sx={{ minWidth: filter.width || 220 }}
		>
			<InputLabel>{filter.label}</InputLabel>
			<Select
				multiple
				value={selectedValues}
				label={filter.label}
				onChange={(e: SelectChangeEvent<typeof selectedValues>) =>
					onUpdate(e.target.value)
				}
				input={<OutlinedInput label={filter.label} />}
				renderValue={(selected) => (
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
						{selected.map((value: any) => {
							const option = filter.options.find((o: any) => o.value === value);
							const invoiceType = INVOICE_TYPES.find((t) => t.value === value);
							const label =
								filter.useShortLabels && invoiceType?.shortLabel
									? invoiceType.shortLabel
									: option?.label || value;

							return <Chip key={value} label={label} size="small" />;
						})}
					</Box>
				)}
			>
				{filter.options.map((option: any) => (
					<MenuItem key={option.value} value={option.value}>
						{option.label}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}
