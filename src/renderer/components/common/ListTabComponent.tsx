import { useState, useRef, useMemo, ReactNode, useEffect } from "react";
import { AppBar, Box } from "@mui/material";
import { FilterBar, FilterBarRef } from "../common/filtering/FilterBar";
import { useTableFilters } from "../../../hooks/useTableFilters";
import { useColumnVisibility } from "../../../hooks/useColumnVisibility";
import { useTabPersistence } from "../../../context/TabPersistanceContext";
import { useAutoSearchFocus } from "../../../hooks/keyboard/useAutosearchFocus";
import { Loading } from "../layout/Loading";
import type { FilterConfig, FilterState } from "../../../types/filter";
import type { Column } from "../common/table/DataTable";
import type { FilterAction } from "../../../types/filter";
import type { OrderByConfig } from "./filtering/ColumnPickerButton";
import { ORDER_STORAGE_KEYS } from "../../../utils/storageUtils";

interface ListTabComponentProps<TData, TFilter extends FilterState> {
	data: TData[];
	isLoading: boolean;
	loadingText: string;
	filterConfig: FilterConfig;
	initialFilterState: TFilter;
	defaultVisibleColumns: string[];
	columns: Column[];
	actions: FilterAction[];
	renderList: (props: {
		data: TData[];
		visibleColumnIds: Set<string>;
		columnOrder: string[];
		onColumnOrderChange: (newOrder: string[]) => void;
		orderBy: OrderByConfig | undefined;
	}) => ReactNode;
	dynamicFilterConfig?: (
		baseConfig: FilterConfig,
		data: TData[],
	) => FilterConfig;
	storageKey: keyof typeof ORDER_STORAGE_KEYS;
	tabKey: "contacts" | "invoices" | "inventory";
	filterActions?: FilterAction[];
	onRemoveDynamicFilter?: (filterId: string) => void;
	customFilterElements?: React.ReactNode;
	filters?: TFilter;
	onFiltersChange?: (filters: TFilter) => void;
}

export function ListTabComponent<
	TData extends Record<string, any>,
	TFilter extends FilterState,
>({
	data,
	isLoading,
	loadingText,
	filterConfig,
	initialFilterState,
	defaultVisibleColumns,
	columns,
	actions,
	renderList,
	dynamicFilterConfig,
	storageKey,
	tabKey,
	filterActions = [],
	onRemoveDynamicFilter,
	customFilterElements,
	filters: externalFilters,
	onFiltersChange: externalOnFiltersChange,
}: ListTabComponentProps<TData, TFilter>) {
	const { getFilterState, setFilterState } = useTabPersistence();
	const initialFilters =
		(getFilterState(tabKey) as TFilter) || initialFilterState;
	const [internalFilters, setInternalFilters] =
		useState<TFilter>(initialFilters);

	const filters = externalFilters ?? internalFilters;
	const setFilters = externalOnFiltersChange ?? setInternalFilters;

	const [orderBy, setOrderBy] = useState<OrderByConfig | undefined>(undefined);

	const {
		visibleColumnIds,
		columnOrder,
		handleVisibleColumnsChange,
		setColumnOrder,
	} = useColumnVisibility(defaultVisibleColumns, storageKey);

	const filterBarRef = useRef<FilterBarRef>(null);

	useEffect(() => {
		if (!externalFilters) {
			setFilterState(tabKey, internalFilters);
		}
	}, [internalFilters, tabKey, setFilterState, externalFilters]);

	useAutoSearchFocus({
		filterBarRef: filterBarRef,
		disabled: false,
	});

	const finalFilterConfig = useMemo(
		() =>
			dynamicFilterConfig
				? dynamicFilterConfig(filterConfig, data)
				: filterConfig,
		[dynamicFilterConfig, filterConfig, data],
	);

	const filteredData = useTableFilters(data, filters, filterConfig);

	if (isLoading) {
		return <Loading text={loadingText} fullScreen />;
	}

	return (
		<Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<AppBar position="static" color="default" elevation={0}>
				<FilterBar
					ref={filterBarRef}
					config={finalFilterConfig}
					filters={filters}
					onFiltersChange={setFilters}
					actions={actions}
					orderBy={orderBy}
					onOrderByChange={setOrderBy}
					onVisibleColumnsChange={handleVisibleColumnsChange}
					columns={columns}
					defaultVisibleColumns={defaultVisibleColumns}
					visibleColumnIds={visibleColumnIds}
					filterActions={filterActions}
					onRemoveDynamicFilter={onRemoveDynamicFilter}
					customFilterElements={customFilterElements}
				/>
			</AppBar>

			<Box
				sx={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				}}
			>
				{renderList({
					data: filteredData,
					visibleColumnIds,
					columnOrder,
					onColumnOrderChange: setColumnOrder,
					orderBy,
				})}
			</Box>
		</Box>
	);
}
