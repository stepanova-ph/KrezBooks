import { useState, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { FilterBar, FilterBarRef } from "../common/filtering/FilterBar";
import { useTableFilters } from "../../../hooks/useTableFilters";
import {
  itemFilterConfig,
  initialItemFilterState,
  defaultVisibleColumnsItem,
} from "../../../config/itemFilterConfig";
import type { ItemFilterState } from "src/types/filter";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import { useItems } from "../../../hooks/useItems";
import ItemsList, { itemColumns } from "../items/ItemsList";
import CreateItemForm from "../items/CreateItemForm";
import { useColumnVisibility } from "../../../hooks/useColumnVisibility";
import { useAutoSearchFocus } from "../../../hooks/keyboard/useAutosearchFocus";
import { Loading } from "../layout/Loading";

function InventoryTab() {
  const { data: items = [], isLoading } = useItems();

  const [filters, setFilters] = useState<ItemFilterState>(
    initialItemFilterState,
  );

  const { 
    visibleColumnIds, 
    columnOrder, 
    handleVisibleColumnsChange, 
    setColumnOrder 
  } = useColumnVisibility(defaultVisibleColumnsItem);

  const filterBarRef = useRef<FilterBarRef>(null);

  // FIXED: pass the parent ref directly, access searchInputRef inside the hook
  useAutoSearchFocus({
    filterBarRef: filterBarRef,
    disabled: false,
  });

  const filteredItems = useTableFilters(items, filters);

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100%',
          height: '100%'
        }}
      >
        <Loading size="large" text="Načítám sklad..." />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <FilterBar
        ref={filterBarRef}
        config={itemFilterConfig}
        filters={filters}
        onFiltersChange={setFilters}
        columns={itemColumns}
        visibleColumnIds={visibleColumnIds}
        onVisibleColumnsChange={handleVisibleColumnsChange}
        defaultColumnIds={defaultVisibleColumnsItem}
        actions={[
          {
            id: "add-item",
            label: "Přidat položku",
            startIcon: <Inventory2Icon />,
            renderDialog: ({ open, onClose }) => (
              <CreateItemForm open={open} onClose={onClose} />
            ),
          },
        ]}
      />

      <ItemsList
        items={filteredItems}
        visibleColumnIds={visibleColumnIds}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
      />
    </Box>
  );
}

export default InventoryTab;