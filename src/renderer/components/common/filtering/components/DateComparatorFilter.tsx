import { Box, TextField } from "@mui/material";
import type { DateComparatorFilterDef } from "src/types/filter";

interface DateComparatorFilterProps {
	filter: DateComparatorFilterDef;
	value: { 
		greaterThan?: string;
		equals?: string;
		lessThan?: string;
		comparator: '>' | '=' | '<';
	};
	onUpdate: (value: { 
		greaterThan?: string;
		equals?: string;
		lessThan?: string;
		comparator: '>' | '=' | '<';
	}) => void;
}

export function DateComparatorFilter({ 
	filter, 
	value, 
	onUpdate 
}: DateComparatorFilterProps) {
	const currentValue = value || { comparator: ">", greaterThan: "", equals: "", lessThan: "" };
	const comparators: Array<{ symbol: '>' | '=' | '<', label: string }> = [
		{ symbol: '>', label: 'Po' },
		{ symbol: '=', label: 'Dne' },
		{ symbol: '<', label: 'Před' }
	];

	return (
		<Box
			key={filter.id}
			sx={{
				display: 'inline-flex',
				flexDirection: 'column',
				gap: 1,
			}}
		>
			{comparators.map((comp) => {
				const displayValue = comp.symbol === '>' ? (currentValue.greaterThan || '') :
				                     comp.symbol === '=' ? (currentValue.equals || '') :
				                     (currentValue.lessThan || '');

				return (
					<Box
						key={comp.symbol}
						sx={{
							display: 'flex',
							gap: 1,
							alignItems: 'center',
						}}
					>
						<Box
							sx={{
								minWidth: 40,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '0.875rem',
								fontWeight: 500,
								color: 'text.secondary',
							}}
						>
							{comp.label}
						</Box>
						<TextField
							size="small"
							type="date"
							value={displayValue}
							onChange={(e) => {
								const input = e.target.value;
								
								if (comp.symbol === '>') {
									onUpdate({ ...currentValue, greaterThan: input });
								} else if (comp.symbol === '=') {
									onUpdate({ ...currentValue, equals: input });
								} else {
									onUpdate({ ...currentValue, lessThan: input });
								}
							}}
							InputLabelProps={{ shrink: true }}
							sx={{
								width: filter.width || 150,
							}}
						/>
					</Box>
				);
			})}
		</Box>
	);
}