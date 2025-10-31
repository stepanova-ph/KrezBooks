import { useState, useRef, useMemo, ReactNode } from "react";
import { Box } from "@mui/material";
import { FilterBar, FilterBarRef } from "../common/filtering/FilterBar";
import { useTableFilters } from "../../../hooks/useTableFilters";
import { useColumnVisibility } from "../../../hooks/useColumnVisibility";
import { useAutoSearchFocus } from "../../../hooks/keyboard/useAutosearchFocus";
import { Loading } from "../layout/Loading";
import type { FilterConfig, FilterState } from "../../../types/filter";
import type { Column } from "../common/table/DataTable";
import type { FilterAction } from "../../../types/filter";

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
	}) => ReactNode;
	dynamicFilterConfig?: (
		baseConfig: FilterConfig,
		data: TData[],
	) => FilterConfig;
}

export function ListTabComponent<TData, TFilter extends FilterState>({
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
}: ListTabComponentProps<TData, TFilter>) {
	const [filters, setFilters] = useState<TFilter>(initialFilterState);

	const {
		visibleColumnIds,
		columnOrder,
		handleVisibleColumnsChange,
		setColumnOrder,
	} = useColumnVisibility(defaultVisibleColumns);

	const filterBarRef = useRef<FilterBarRef>(null);

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

	const filteredData = useTableFilters(data, filters, finalFilterConfig);

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
		<Box sx={{ p: 3 }}>
			<FilterBar
				ref={filterBarRef}
				config={finalFilterConfig}
				filters={filters}
				onFiltersChange={setFilters}
				columns={columns}
				visibleColumnIds={visibleColumnIds}
				onVisibleColumnsChange={handleVisibleColumnsChange}
				defaultColumnIds={defaultVisibleColumns}
				actions={actions}
			/>

			{renderList({
				data: filteredData,
				visibleColumnIds,
				columnOrder,
				onColumnOrderChange: setColumnOrder,
			})}
		</Box>
	);
}