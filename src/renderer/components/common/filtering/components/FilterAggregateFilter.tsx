// filters/FilterAggregateFilter.tsx
import { Box, Button, TextField, IconButton, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CloseIcon from "@mui/icons-material/Close";
import type { FilterAggregateFilterDef, FilterDef } from "src/types/filter";
import type { ReactNode } from "react";
import { useRef, useState, useEffect } from "react";

interface FilterAggregateFilterProps {
	filter: FilterAggregateFilterDef;
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
	isExpanded: boolean;
	onToggleExpanded: () => void;
	isRemovable: boolean;
	onRemove?: () => void;
	renderExpandedFilter: (filter: FilterDef) => ReactNode;
}

export function FilterAggregateFilter({ 
	filter, 
	value, 
	onUpdate,
	isExpanded,
	onToggleExpanded,
	isRemovable,
	onRemove,
	renderExpandedFilter
}: FilterAggregateFilterProps) {
	if (filter.primaryFilter.type !== 'number-comparator') return null;

	const currentValue = value || { comparator: ">", greaterThan: "", equals: "", lessThan: "" };
	const comparators: Array<'>' | '=' | '<'> = ['>', '=', '<'];
	
	const collapsedRef = useRef<HTMLDivElement>(null);
	const [collapsedWidth, setCollapsedWidth] = useState<number | undefined>(undefined);

	// Measure collapsed width when not expanded
	useEffect(() => {
		if (!isExpanded && collapsedRef.current) {
			setCollapsedWidth(collapsedRef.current.offsetWidth);
		}
	}, [isExpanded]);

	const getComparatorIcon = () => {
		switch (currentValue.comparator) {
			case '>': return '>';
			case '=': return '=';
			case '<': return '<';
		}
	};

	const cycleComparator = () => {
		const next = currentValue.comparator === '>' ? '=' : currentValue.comparator === '=' ? '<' : '>';
		onUpdate({ ...currentValue, comparator: next });
	};

	const getCollapsedValue = () => {
		switch (currentValue.comparator) {
			case '>': return currentValue.greaterThan || '';
			case '=': return currentValue.equals || '';
			case '<': return currentValue.lessThan || '';
		}
	};

	const updateCollapsedValue = (newValue: string) => {
		switch (currentValue.comparator) {
			case '>':
				onUpdate({ ...currentValue, greaterThan: newValue });
				break;
			case '=':
				onUpdate({ ...currentValue, equals: newValue });
				break;
			case '<':
				onUpdate({ ...currentValue, lessThan: newValue });
				break;
		}
	};

	return (
		<Box
			key={filter.id}
			sx={{
				position: 'relative',
				display: 'inline-block',
				backgroundColor: 'background.paper',
			}}
		>
			{/* Collapsed view - visible or invisible placeholder */}
			<Box
				ref={collapsedRef}
				sx={{
					display: 'inline-flex',
					border: (theme) => `1px solid ${theme.palette.divider}`,
					borderRadius: 1,
					bgcolor: 'background.default',
					visibility: isExpanded ? 'hidden' : 'visible',
					
				}}
			>
				<Button
					onClick={cycleComparator}
					size="small"
					variant="text"
					sx={{
						minWidth: 40,
						height: 37,
						borderTopRightRadius: 0,
						borderBottomRightRadius: 0,
						fontSize: '1rem',
						fontWeight: 'bold',
						px: 1,
						borderRight: (theme) => `1px solid ${theme.palette.divider}`,
					}}
				>
					{getComparatorIcon()}
				</Button>
				<TextField
					size="small"
					label={filter.primaryFilter.label}
					placeholder={filter.primaryFilter.placeholder || "0"}
					value={getCollapsedValue()}
					onChange={(e) => {
						const input = e.target.value;
						if (filter.primaryFilter.allowNegative) {
							if (input === '' || input === '-' || /^-?\d*$/.test(input)) {
								updateCollapsedValue(input);
							}
						} else {
							const numOnly = input.replace(/\D/g, "");
							updateCollapsedValue(numOnly);
						}
					}}
					sx={{
						width: filter.primaryFilter.width || 100,
						'& .MuiOutlinedInput-root': {
							'& fieldset': { border: 'none' },
						},
					}}
				/>
				<Box sx={{ display: 'flex' }}>
					{filter.collapsible && (
						<IconButton
							size="small"
							onClick={onToggleExpanded}
							sx={{
								height: 37,
								borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
								borderRadius: 0,
							}}
						>
							<AddIcon fontSize="small" />
						</IconButton>
					)}
					{isRemovable && onRemove && (
						<IconButton
							size="small"
							onClick={onRemove}
							sx={{ 
								height: 37,
								borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
								borderRadius: 0,
							}}
							title="Odstranit filtr"
						>
							<CloseIcon fontSize="small" />
						</IconButton>
					)}
				</Box>
			</Box>

			{/* Expanded view - absolutely positioned */}
			{isExpanded && (
				<Box
					sx={{
						position: 'absolute',
						top: 0,
						left: 0,
						display: 'inline-flex',
						flexDirection: 'column',
						border: (theme) => `1px solid ${theme.palette.divider}`,
						borderRadius: 1,
						bgcolor: 'background.default',
						zIndex: 1000,
						boxShadow: 2,
					}}
				>
					{comparators.map((comp, index) => {
						const displayValue = comp === '>' ? (currentValue.greaterThan || '') :
						                     comp === '=' ? (currentValue.equals || '') :
						                     (currentValue.lessThan || '');

						return (
							<Box
								key={comp}
								sx={{
									display: 'flex',
									borderBottom: index < comparators.length - 1 ? (theme) => `1px solid ${theme.palette.divider}` : 'none',
								}}
							>
								<Box
									sx={{
										minWidth: 40,
										height: 37,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										borderRight: (theme) => `1px solid ${theme.palette.divider}`,
										fontSize: '1rem',
										fontWeight: 'bold',
										bgcolor: 'action.disabledBackground',
										color: 'text.disabled',
									}}
								>
									{comp}
								</Box>
								<TextField
									size="small"
									label={filter.primaryFilter.label}
									placeholder={filter.primaryFilter.placeholder || "0"}
									value={displayValue}
									onChange={(e) => {
										const input = e.target.value;
										let newValue = input;
										if (filter.primaryFilter.allowNegative) {
											if (input !== '' && input !== '-' && !/^-?\d*$/.test(input)) {
												return;
											}
										} else {
											newValue = input.replace(/\D/g, "");
										}
										
										if (comp === '>') {
											onUpdate({ ...currentValue, greaterThan: newValue });
										} else if (comp === '=') {
											onUpdate({ ...currentValue, equals: newValue });
										} else {
											onUpdate({ ...currentValue, lessThan: newValue });
										}
									}}
									sx={{
										width: filter.primaryFilter.width || 100,
										'& .MuiOutlinedInput-root': {
											'& fieldset': { border: 'none' },
										},
									}}
								/>
								
								{index === 0 && (
									<Box sx={{ display: 'flex' }}>
										{filter.collapsible && (
											<IconButton
												size="small"
												onClick={onToggleExpanded}
												sx={{
													height: 37,
													borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
													borderRadius: 0,
												}}
											>
												<RemoveIcon fontSize="small" />
											</IconButton>
										)}
										{isRemovable && onRemove && (
											<IconButton
												size="small"
												onClick={onRemove}
												sx={{ 
													height: 37,
													borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
													borderRadius: 0,
												}}
												title="Odstranit filtr"
											>
												<CloseIcon fontSize="small" />
											</IconButton>
										)}
									</Box>
								)}
							</Box>
						);
					})}

					{filter.expandedFilters.length > 0 && (
						<>
							<Divider sx={{ borderColor: 'divider' }} />
							<Box sx={{ p: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
								{filter.expandedFilters.map((subFilter) => renderExpandedFilter(subFilter))}
							</Box>
						</>
					)}
				</Box>
			)}
		</Box>
	);
}