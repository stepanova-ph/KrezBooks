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
		/** NEW: provide current orderBy to list renderer */
		orderBy: OrderByConfig | undefined;
	}) => ReactNode;
	dynamicFilterConfig?: (
		baseConfig: FilterConfig,
		data: TData[],
	) => FilterConfig;
	storageKey: keyof typeof ORDER_STORAGE_KEYS;
	tabKey: "contacts" | "invoices" | "inventory";
	filterActions?: FilterAction[]; // Actions for filter buttons (add dynamic filters)
	onRemoveDynamicFilter?: (filterId: string) => void; // Callback to remove dynamic filters
	customFilterElements?: React.ReactNode;
}

export function ListTabComponent<TData extends Record<string, any>, TFilter extends FilterState>({
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
	customFilterElements = []
}: ListTabComponentProps<TData, TFilter>) {
	const { getFilterState, setFilterState } = useTabPersistence();
	const initialFilters = (getFilterState(tabKey) as TFilter) || initialFilterState;
	const [filters, setFilters] = useState<TFilter>(initialFilters);

	const [orderBy, setOrderBy] = useState<OrderByConfig | undefined>(undefined);

	const {
		visibleColumnIds,
		columnOrder,
		handleVisibleColumnsChange,
		setColumnOrder,
	} = useColumnVisibility(defaultVisibleColumns, storageKey);

	const filterBarRef = useRef<FilterBarRef>(null);

	useEffect(() => {
		setFilterState(tabKey, filters);
	}, [filters, tabKey, setFilterState]);

	useAutoSearchFocus({
		filterBarRef: filterBarRef,
		disabled: false,
	});

	const finalFilterConfig = useMemo(() => {
		if (dynamicFilterConfig) {
			return dynamicFilterConfig(filterConfig, data);
		}
		return filterConfig;
	}, [dynamicFilterConfig, filterConfig, data]);

	const filteredData = useTableFilters<TData>(data, filters, finalFilterConfig);

	if (isLoading) {
		return (
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "100%",
					height: "100%",
				}}
			>
				<Loading size="large" text={loadingText} />
			</Box>
		);
	}

	return (
		<>
			<AppBar
				position="sticky"
				sx={{
					bgcolor: "transparent",
					backgroundImage: "none",
					boxShadow: "none",
					m: 0,
					height: "auto",
					"&::before": { display: "none" }, // kills the colored underline pseudo-element
				}}
			>
				<Box
					sx={{
						position: "sticky",
						top: 0,
						zIndex: (t) => t.zIndex.appBar, // same layer as sticky filters
						m: 0,
						p: 0,
						// the gradient lives behind the FilterBar
						"&::before": {
							content: '""',
							position: "absolute",
							top: -70,
							left: 0,
							right: 0,
							height: 80, // adjust fade depth as you like
							background:
								"linear-gradient(to bottom, rgba(255,255,255,1), rgba(255, 255, 255, 0.45))",
							pointerEvents: "none",
							zIndex: 0, // behind the bar
						},
					}}
				>
					<Box sx={{ position: "relative", zIndex: 1 }}>
						<FilterBar
							ref={filterBarRef}
							config={finalFilterConfig}
							filters={filters}
							onFiltersChange={setFilters as (filters: FilterState) => void}
							columns={columns}
							visibleColumnIds={visibleColumnIds}
							onVisibleColumnsChange={handleVisibleColumnsChange}
							defaultColumnIds={defaultVisibleColumns}
							actions={actions}
							filterActions={filterActions}
							onRemoveDynamicFilter={onRemoveDynamicFilter}
							orderBy={orderBy}
							onOrderByChange={setOrderBy}
							customFilterElements={customFilterElements}
						/>
					</Box>
				</Box>
			</AppBar>
			<Box sx={{ p: 3, pt: 1 }}>
				{renderList({
					data: filteredData,
					visibleColumnIds,
					columnOrder,
					onColumnOrderChange: setColumnOrder,
					orderBy,
				})}
			</Box>
		</>
	);
}
