import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { ReactNode } from "react";
import { FilterConfig, FilterState, FilterDef } from "src/types/filter";
import { ColumnPickerButton } from "./ColumnPickerButton";
import type { Column } from "../table/DataTable";
import type { FilterAction } from "src/types/filter";
import type { OrderByConfig } from "./ColumnPickerButton";
import { TextSearchFilter } from "./components/TextSearchFilter";
import { ActionButtonFilter } from "./components/ActionButtonFilter";
import { CheckboxFilter } from "./components/CheckboxFilter";
import { MultiSelectFilter } from "./components/MultiSelectFilter";
import { NumberInputFilter } from "./components/NumberInputFilter";
import { SelectFilter } from "./components/SelectFilter";
import { NumberComparatorFilter } from "./components/NumberComparatorFilter";
import { FilterAggregateFilter } from "./components";
import { clear } from "console";
import { DateComparatorFilter } from "./components/DateComparatorFilter";

// Import filter components


interface FilterBarProps {
	config: FilterConfig;
	filters: FilterState;
	onFiltersChange: (filters: FilterState) => void;
	columns: Column[];
	visibleColumnIds: Set<string>;
	onVisibleColumnsChange: (columnIds: Set<string>) => void;
	defaultColumnIds?: string[];
	actions?: FilterAction[];
	filterActions?: FilterAction[];
	onRemoveDynamicFilter?: (filterId: string) => void;
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
			(f) => 
				!f.columnId 
				|| visibleColumnIds.has(f.columnId) 
				|| f.id.includes("_aggregate"),
		);

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
						clearFilter(filter.primaryFilter);
						filter.expandedFilters.forEach(subFilter => {
							if (subFilter.type !== "action-button") {
								clearFilter(subFilter);
							}
						});
						break;
					case "date-comparator":
						cleared[filter.id] = { greaterThan: "", equals: "", lessThan: "", comparator: ">" };
						break;
					case "action-button":
						break;
				}
			};

			config.filters.forEach(clearFilter);
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

		const renderFilter = (filter: FilterDef): ReactNode => {
			switch (filter.type) {
				case "text-search":
					return (
						<TextSearchFilter
							filter={filter}
							value={filters[filter.id] || ""}
							onUpdate={(value) => updateFilter(filter.id, value)}
							searchInputRef={filter.id === "search" ? searchInputRef : undefined}
						/>
					);

				case "checkbox": {
					const canUncheck = validateRequiredGroup(filter.id, false);
					return (
						<CheckboxFilter
							filter={filter}
							value={!!filters[filter.id]}
							onUpdate={(value) => updateFilter(filter.id, value)}
							canUncheck={canUncheck}
						/>
					);
				}

				case "number-input":
					return (
						<NumberInputFilter
							filter={filter}
							value={filters[filter.id] || ""}
							onUpdate={(value) => updateFilter(filter.id, value)}
						/>
					);

				// case "number-with-prefix":
				// 	return (
				// 		<NumberWithPrefixFilter
				// 			filter={filter}
				// 			value={filters[filter.id] || { prefix: null, value: "" }}
				// 			onUpdate={(value) => updateFilter(filter.id, value)}
				// 		/>
				// 	);

				case "select":
					return (
						<SelectFilter
							filter={filter}
							value={filters[filter.id] ?? null}
							onUpdate={(value) => updateFilter(filter.id, value)}
						/>
					);

				case "multiselect":
					return (
						<MultiSelectFilter
							filter={filter}
							value={filters[filter.id] || []}
							onUpdate={(value) => updateFilter(filter.id, value)}
						/>
					);

				case "number-comparator":
					return (
						<NumberComparatorFilter
							filter={filter}
							value={filters[filter.id] || { value: "", comparator: ">" }}
							onUpdate={(value) => updateFilter(filter.id, value)}
						/>
					);
				
				case "date-comparator":
					return (
						<DateComparatorFilter
							filter={filter}
							value={filters[filter.id] || { greaterThan: "", equals: "", lessThan: "", comparator: ">" }}
							onUpdate={(value) => updateFilter(filter.id, value)}
						/>
					);

				case "action-button":
					return (
						<ActionButtonFilter
							filter={filter}
							actions={actions}
							filterActions={filterActions}
							onOpenAction={(actionId) => setOpenActionId(actionId)}
						/>
					);

				case "filter-aggregate": {
					const isExpanded = filters._aggregateExpanded?.[filter.id] ?? filter.defaultExpanded ?? false;
					const isRemovable = isDynamicFilter(filter.id);
					
					let defaultValue: any;
					if (filter.primaryFilter.type === 'date-comparator') {
						defaultValue = { greaterThan: "", equals: "", lessThan: "", comparator: ">" };
					} else {
						defaultValue = { value: "", comparator: ">" };
					}

					return (
						<FilterAggregateFilter
							filter={filter}
							value={filters[filter.primaryFilter.id] || defaultValue}
							onUpdate={(value) => updateFilter(filter.primaryFilter.id, value)}
							isExpanded={isExpanded}
							onToggleExpanded={() => {
								updateFilter("_aggregateExpanded", {
									...(filters._aggregateExpanded || {}),
									[filter.id]: !isExpanded,
								});
							}}
							isRemovable={isRemovable}
							onRemove={isRemovable && onRemoveDynamicFilter ? () => onRemoveDynamicFilter(filter.id) : undefined}
							renderExpandedFilter={(subFilter) => renderFilter(subFilter)}
						/>
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
						{!hideColumnPicker && (
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