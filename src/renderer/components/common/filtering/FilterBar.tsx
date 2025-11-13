import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import {
	Box,
	TextField,
	FormControlLabel,
	Select,
	MenuItem,
	Button,
	IconButton,
	FormControl,
	InputLabel,
	Chip,
	OutlinedInput,
	SelectChangeEvent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { ReactNode } from "react";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { FilterConfig, FilterState, FilterDef } from "src/types/filter";
import { ColumnPickerButton } from "./ColumnPickerButton";
import type { Column } from "../table/DataTable";
import type { FilterAction } from "src/types/filter";
import { KeyboardCheckbox } from "../inputs/KeyboardCheckbox";
import type { OrderByConfig } from "./ColumnPickerButton";

interface FilterBarProps {
	config: FilterConfig;
	filters: FilterState;
	onFiltersChange: (filters: FilterState) => void;
	columns: Column[];
	visibleColumnIds: Set<string>;
	onVisibleColumnsChange: (columnIds: Set<string>) => void;
	defaultColumnIds?: string[];
	actions?: FilterAction[];
	filterActions?: FilterAction[]; // Actions for filter buttons (add dynamic filters)
	onRemoveDynamicFilter?: (filterId: string) => void; // Callback to remove dynamic filters
	clearLabel?: string;
	orderBy?: OrderByConfig;
	onOrderByChange?: (orderBy: OrderByConfig) => void;
	hideColumnPicker?: boolean;
}

export interface FilterBarRef {
	searchInputRef: React.RefObject<HTMLInputElement>;
}

export const FilterBar = forwardRef<FilterBarRef, FilterBarProps>(
	(
		{
			config,
			filters,
			onFiltersChange,
			columns,
			visibleColumnIds,
			onVisibleColumnsChange,
			defaultColumnIds = [],
			actions = [],
			filterActions = [],
			onRemoveDynamicFilter,
			clearLabel = "Vymazat filtry",
			orderBy,
			onOrderByChange,
			hideColumnPicker = false,
		},
		ref,
	) => {
		const [openActionId, setOpenActionId] = useState<string | null>(null);
		const searchInputRef = useRef<HTMLInputElement>(null);

		useImperativeHandle(ref, () => ({
			searchInputRef,
		}));

		const visibleFilters = config.filters.filter(
			(f) => !f.columnId || visibleColumnIds.has(f.columnId),
		);

		// Helper to check if a filter is dynamic (removable)
		const isDynamicFilter = (filterId: string): boolean => {
			return filterId.includes("_aggregate") && (filterId === "date_due_aggregate" || filterId === "date_tax_aggregate");
		};

		const updateFilter = (filterId: string, value: any) => {
			onFiltersChange({ ...filters, [filterId]: value });
		};

		const handleClearFilters = () => {
			const cleared: FilterState = {};

			const clearFilter = (filter: FilterDef) => {
				switch (filter.type) {
					case "text-search":
					case "number-input":
						cleared[filter.id] = "";
						break;
					case "checkbox":
						cleared[filter.id] = filter.required ? true : false;
						break;
					case "number-with-prefix":
						cleared[filter.id] = { prefix: null, value: "" };
						break;
					case "select":
						cleared[filter.id] = null;
						break;
					case "multiselect":
						cleared[filter.id] = [];
						break;
					case "number-comparator":
						cleared[filter.id] = { value: "", comparator: ">" };
						break;
					case "filter-aggregate":
						// Clear primary filter
						clearFilter(filter.primaryFilter);
						// Clear expanded filters
						filter.expandedFilters.forEach(subFilter => {
							if (subFilter.type !== "action-button") {
								clearFilter(subFilter);
							}
						});
						break;
					case "action-button":
						// No state to clear
						break;
				}
			};

			config.filters.forEach(clearFilter);

			// Clear expansion state
			cleared._aggregateExpanded = {};

			onFiltersChange(cleared);
		};

		const validateRequiredGroup = (
			filterId: string,
			newValue: boolean,
		): boolean => {
			const filter = config.filters.find((f) => f.id === filterId);
			if (
				!filter ||
				filter.type !== "checkbox" ||
				!filter.required ||
				!filter.group
			)
				return true;
			const groupFilters = config.filters.filter(
				(f) => f.type === "checkbox" && f.group === filter.group,
			);
			const checkedCount = groupFilters.filter((f) =>
				f.id === filterId ? newValue : filters[f.id],
			).length;
			return checkedCount > 0;
		};

		const renderFilter = (
			filter: (typeof visibleFilters)[number],
		): ReactNode => {
			return renderFilterInternal(filter, false);
		};

		const renderFilterWithLock = (
			filter: FilterDef,
			locked: boolean
		): ReactNode => {
			return renderFilterInternal(filter, locked);
		};

		const renderFilterInternal = (
			filter: FilterDef,
			locked: boolean = false,
		): ReactNode => {
			switch (filter.type) {
				case "text-search":
					return (
						<TextField
							key={filter.id}
							size="small"
							label={filter.label}
							value={filters[filter.id] || ""}
							onChange={(e) => updateFilter(filter.id, e.target.value)}
							inputRef={filter.id === "search" ? searchInputRef : undefined}
							sx={{ minWidth: filter.width || 250 }}
						/>
					);

				case "checkbox": {
					const canUncheck = validateRequiredGroup(filter.id, false);
					const checked = !!filters[filter.id];
					return (
						<FormControlLabel
							sx={{
								color: (theme) =>
									checked
										? theme.palette.primary.main
										: theme.palette.text.secondary,
							}}
							key={filter.id}
							control={
								<KeyboardCheckbox
									checked={checked}
									onChange={(e) => {
										if (!e.target.checked && !canUncheck) return;
										updateFilter(filter.id, e.target.checked);
									}}
								/>
							}
							label={filter.label}
						/>
					);
				}

				case "number-input": {
					const value = filters[filter.id] || "";
					const validation = filter.validate
						? filter.validate(value)
						: { valid: true };
					return (
						<TextField
							key={filter.id}
							size="small"
							label={filter.label}
							placeholder={filter.placeholder}
							value={value}
							onChange={(e) => {
								const newValue = e.target.value.replace(/\D/g, "");
								if (filter.maxLength && newValue.length > filter.maxLength)
									return;
								updateFilter(filter.id, newValue);
							}}
							error={!validation.valid}
							helperText={validation.error}
							sx={{ minWidth: filter.width || 150 }}
						/>
					);
				}

				case "number-with-prefix": {
					const dicValue = filters[filter.id] || { prefix: null, value: "" };
					const isCustom = dicValue.prefix === "vlastní";
					const validation = filter.validate
						? filter.validate(dicValue.prefix, dicValue.value)
						: { valid: true };

					return (
						<Box
							key={filter.id}
							sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
						>
							{!isCustom ? (
								<>
									<FormControl
										size="small"
										sx={{ minWidth: filter.prefixWidth || 70 }}
									>
										<InputLabel>{filter.label}</InputLabel>
										<Select
											value={dicValue.prefix || ""}
											label={filter.label}
											onChange={(e) => {
												const newPrefix = e.target.value || null;
												updateFilter(filter.id, {
													prefix: newPrefix,
													value: newPrefix ? dicValue.value : "",
												});
											}}
										>
											<MenuItem value="">
												<em>Vybrat...</em>
											</MenuItem>
											{filter.prefixes.map((prefix: string) => (
												<MenuItem key={prefix} value={prefix}>
													{prefix}
												</MenuItem>
											))}
										</Select>
									</FormControl>
									<TextField
										size="small"
										placeholder={filter.placeholder}
										value={dicValue.value}
										disabled={!dicValue.prefix}
										onChange={(e) => {
											const newValue = e.target.value.replace(/\D/g, "");
											updateFilter(filter.id, { ...dicValue, value: newValue });
										}}
										error={!validation.valid}
										helperText={validation.error}
										sx={{ minWidth: filter.width || 150 }}
									/>
								</>
							) : (
								<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
									<TextField
										size="small"
										label={filter.label}
										placeholder={filter.customPlaceholder}
										value={dicValue.value}
										onChange={(e) =>
											updateFilter(filter.id, {
												...dicValue,
												value: e.target.value,
											})
										}
										error={!validation.valid}
										helperText={validation.error}
										sx={{ minWidth: filter.width || 200 }}
									/>
									<IconButton
										size="small"
										onClick={() =>
											updateFilter(filter.id, { prefix: null, value: "" })
										}
										title="Zrušit vlastní DIČ"
									>
										<CloseIcon fontSize="small" />
									</IconButton>
								</Box>
							)}
						</Box>
					);
				}

				case "select":
					return (
						<FormControl
							key={filter.id}
							size="small"
							sx={{ minWidth: filter.width || 180 }}
						>
							<InputLabel>{filter.label}</InputLabel>
							<Select
								value={filters[filter.id] ?? ""}
								label={filter.label}
								onChange={(e: SelectChangeEvent) =>
									updateFilter(filter.id, e.target.value || null)
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

				case "multiselect": {
					const selectedValues = filters[filter.id] || [];
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
									updateFilter(filter.id, e.target.value)
								}
								input={<OutlinedInput label={filter.label} />}
								renderValue={(selected) => (
									<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
										{selected.map((value: any) => {
											const option = filter.options.find(
												(o: any) => o.value === value,
											);
											return (
												<Chip
													key={value}
													label={option?.label || value}
													size="small"
												/>
											);
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
case "number-comparator": {
	const value = filters[filter.id] || { value: "", comparator: ">" };

	const getComparatorIcon = () => {
		switch (value.comparator) {
			case '>': return '>';
			case '=': return '=';
			case '<': return '<';
		}
	};

	const cycleComparator = () => {
		const next = value.comparator === '>' ? '=' : value.comparator === '=' ? '<' : '>';
		updateFilter(filter.id, { ...value, comparator: next });
	};

	return (
		<Box key={filter.id} sx={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
			{locked ? (
				<Box
					sx={{
						minWidth: 40,
						height: 37,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						border: (theme) => `1px solid ${theme.palette.grey[400]}`,
						borderTopRightRadius: 0,
						borderBottomRightRadius: 0,
						borderRight: 'none',
						fontSize: '1rem',
						fontWeight: 'bold',
						bgcolor: 'action.disabledBackground',
						color: 'text.disabled',
					}}
				>
					{getComparatorIcon()}
				</Box>
			) : (
				<Button
					onClick={cycleComparator}
					size="small"
					variant="outlined"
					sx={{
						minWidth: 40,
						height: 37,
						borderColor: (theme) => theme.palette.grey[400],
						borderTopRightRadius: 0,
						borderBottomRightRadius: 0,
						borderRight: 'none',
						fontSize: '1rem',
						fontWeight: 'bold',
						px: 1,
					}}
				>
					{getComparatorIcon()}
				</Button>
			)}
			<TextField
				size="small"
				label={filter.label}
				placeholder={filter.placeholder || "0"}
				value={value.value}
				onChange={(e) => {
					const input = e.target.value;
					if (filter.allowNegative) {
						if (input === '' || input === '-' || /^-?\d*$/.test(input)) {
							updateFilter(filter.id, { ...value, value: input });
						}
					} else {
						const numOnly = input.replace(/\D/g, "");
						updateFilter(filter.id, { ...value, value: numOnly });
					}
				}}
				sx={{
					width: filter.width || 100,
					'& .MuiOutlinedInput-root': {
						borderTopLeftRadius: 0,
						borderBottomLeftRadius: 0,
					},
				}}
			/>
		</Box>
	);
}

			case "action-button": {
				return (
					<Button
						key={filter.id}
						variant={filter.variant || "outlined"}
						size="small"
						onClick={() => {
							// First check filterActions, then actions
							const action = [...filterActions, ...actions].find(a => a.id === filter.actionId);
							if (action?.renderDialog) {
								setOpenActionId(action.id);
							} else {
								action?.onClick?.();
							}
						}}
					>
						{filter.label}
					</Button>
				);
			}

			case "filter-aggregate": {
				const isExpanded = filters._aggregateExpanded?.[filter.id] ?? filter.defaultExpanded ?? false;
				const lockPrimary = filter.lockPrimaryWhenExpanded ?? true;
				const isRemovable = isDynamicFilter(filter.id);

				const toggleExpanded = () => {
					const newExpanded = !isExpanded;
					updateFilter("_aggregateExpanded", {
						...(filters._aggregateExpanded || {}),
						[filter.id]: newExpanded,
					});
				};

				return (
					<Box key={filter.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
						{/* Primary filter row with expand/collapse button */}
						<Box sx={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
							{/* Render primary filter with locked state */}
							{renderFilterWithLock(filter.primaryFilter, isExpanded && lockPrimary)}

							{/* Expand/collapse button */}
							{filter.collapsible && (
								<IconButton
									size="small"
									onClick={toggleExpanded}
									sx={{ height: 37 }}
								>
									{isExpanded ? <RemoveIcon /> : <AddIcon />}
								</IconButton>
							)}

							{/* Remove button for dynamic filters */}
							{isRemovable && onRemoveDynamicFilter && (
								<IconButton
									size="small"
									onClick={() => onRemoveDynamicFilter(filter.id)}
									sx={{ height: 37 }}
									title="Odstranit filtr"
								>
									<CloseIcon fontSize="small" />
								</IconButton>
							)}
						</Box>

						{/* Expanded filters */}
						{isExpanded && (
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pl: 1 }}>
								{filter.expandedFilters.map((subFilter) =>
									renderFilterInternal(subFilter, false)
								)}
							</Box>
						)}
					</Box>
				);
			}

				default:
					return null;
			}
		};

		const activeAction = actions.find((a) => a.id === openActionId);

		return (
			<>
				<Box
					sx={{
						display: "flex",
						gap: 2,
						p: 2,
						bgcolor: "background.default",
						borderRadius: 1,
						border: (theme) => `1px solid ${theme.palette.divider}`,
						mb: 2,
						alignItems: "flex-start",
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexWrap: "wrap",
							gap: 2,
							alignItems: "flex-start",
							flex: 1,
						}}
					>
						{visibleFilters.map(renderFilter)}
					</Box>

					<Box
						sx={{
							display: "flex",
							gap: 1,
							alignItems: "flex-start",
							flexShrink: 0,
						}}
					>
						{!hideColumnPicker && ( // NEW - conditionally render
							<ColumnPickerButton
								columns={columns}
								visibleColumnIds={visibleColumnIds}
								onVisibleColumnsChange={onVisibleColumnsChange}
								defaultColumnIds={defaultColumnIds}
								orderBy={orderBy}
								onOrderByChange={onOrderByChange}
							/>
						)}

						<Button
							variant="outlined"
							size="small"
							onClick={handleClearFilters}
						>
							{clearLabel}
						</Button>

						{actions.map((a) => (
							<Button
								key={a.id}
								variant={a.variant || "contained"}
								size="small"
								startIcon={a.startIcon ?? <AddIcon />}
								onClick={() => {
									if (a.renderDialog) {
										setOpenActionId(a.id);
									} else {
										a.onClick?.();
									}
								}}
							>
								{a.label}
							</Button>
						))}
					</Box>
				</Box>

				{activeAction?.renderDialog?.({
					open: !!openActionId,
					onClose: () => setOpenActionId(null),
				})}
			</>
		);
	},
);

FilterBar.displayName = "FilterBar";

export default FilterBar;
