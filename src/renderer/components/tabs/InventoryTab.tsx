import { useState, useRef, useMemo } from "react"; // Add useMemo
import { Box } from "@mui/material";
import { FilterBar, FilterBarRef } from "../common/filtering/FilterBar";
import { useTableFilters } from "../../../hooks/useTableFilters";
import {
  itemFilterConfig,
  initialItemFilterState,
  defaultVisibleColumnsItem,
} from "../../../config/itemFilterConfig";
import type { ItemFilterState } from "src/types/filter";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import { useItems, useItemCategories } from "../../../hooks/useItems"; // Add useItemCategories
import ItemsList, { itemColumns } from "../items/ItemsList";
import CreateItemForm from "../items/CreateItemForm";
import { useColumnVisibility } from "../../../hooks/useColumnVisibility";
import { useAutoSearchFocus } from "../../../hooks/keyboard/useAutosearchFocus";
import { Loading } from "../layout/Loading";

function InventoryTab() {
  const { data: items = [], isLoading } = useItems();
  const { data: categories = [] } = useItemCategories(); // Add this

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

  useAutoSearchFocus({
    filterBarRef: filterBarRef,
    disabled: false,
  });

  // Build dynamic config with categories
  const dynamicConfig = useMemo(() => {
    const config = { ...itemFilterConfig };
    const categoryFilter = config.filters.find(f => f.id === 'category');
    if (categoryFilter && categoryFilter.type === 'multiselect') {
      categoryFilter.options = categories.map(cat => ({
        value: cat,
        label: cat,
      }));
    }
    return config;
  }, [categories]);

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
        config={dynamicConfig} // Use dynamicConfig instead of itemFilterConfig
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