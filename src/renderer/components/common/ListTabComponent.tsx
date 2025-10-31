import { useState, useRef, useMemo, ReactNode } from "react";
import { AppBar, Box } from "@mui/material";
import { FilterBar, FilterBarRef } from "../common/filtering/FilterBar";
import { useTableFilters } from "../../../hooks/useTableFilters";
import { useColumnVisibility } from "../../../hooks/useColumnVisibility";
import { useAutoSearchFocus } from "../../../hooks/keyboard/useAutosearchFocus";
import { Loading } from "../layout/Loading";
import type { FilterConfig, FilterState } from "../../../types/filter";
import type { Column } from "../common/table/DataTable";
import type { FilterAction } from "../../../types/filter";
import type { OrderByConfig } from "../common/filtering/ColumnSelectorButton";

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
  dynamicFilterConfig?: (baseConfig: FilterConfig, data: TData[]) => FilterConfig;
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
  const [orderBy, setOrderBy] = useState<OrderByConfig | undefined>(undefined);

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
	<>
		<AppBar position="sticky" sx={{
			bgcolor: 'transparent',
			backgroundImage: 'none',
			boxShadow: 'none',
			m: 0,
			height: 'auto',
			'&::before': { display: 'none' }, // kills the colored underline pseudo-element
		}}>
			<Box
			sx={{
				position: "sticky",
				top: 0,
				zIndex: (t) => t.zIndex.appBar,  // same layer as sticky filters
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
				background: "linear-gradient(to bottom, rgba(255,255,255,1), rgba(255, 255, 255, 0.45))",
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
				onFiltersChange={setFilters}
				columns={columns}
				visibleColumnIds={visibleColumnIds}
				onVisibleColumnsChange={handleVisibleColumnsChange}
				defaultColumnIds={defaultVisibleColumns}
				actions={actions}
				orderBy={orderBy}
				onOrderByChange={setOrderBy}
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
