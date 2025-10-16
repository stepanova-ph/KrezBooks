import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { FilterBar } from '../common/FilterBar';
import { useTableFilters } from '../../../hooks/useTableFilters';
import { itemFilterConfig, initialItemFilterState, defaultVisibleColumnsItem } from '../../../config/itemFilterConfig';
import type { ItemFilterState } from 'src/types/filter';
import Inventory2Icon from '@mui/icons-material/Inventory2';

import { useItems } from '../../../hooks/useItems';
import ItemsList, { itemColumns } from '../items/ItemsList';
import CreateItemForm from '../items/CreateItemForm';

function InventoryTab() {
  const { data: items = [], isLoading } = useItems();

  const [filters, setFilters] = useState<ItemFilterState>(initialItemFilterState);
  const [visibleColumnIds, setVisibleColumnIds] = useState<Set<string>>(
    new Set(defaultVisibleColumnsItem)
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultVisibleColumnsItem);

  // Handler that syncs both visibleColumnIds and columnOrder
  const handleVisibleColumnsChange = (newVisibleColumnIds: Set<string>) => {
    setVisibleColumnIds(newVisibleColumnIds);
    
    // Check if we're resetting to default columns
    const isResettingToDefault = 
      newVisibleColumnIds.size === defaultVisibleColumnsItem.length &&
      defaultVisibleColumnsItem.every(id => newVisibleColumnIds.has(id));
    
    if (isResettingToDefault) {
      // Reset to default order
      setColumnOrder(defaultVisibleColumnsItem);
    } else {
      // Update column order to match the new visible columns
      // Keep existing order for columns that are still visible,
      // and add newly visible columns at the end
      const newVisibleArray = Array.from(newVisibleColumnIds);
      const orderedVisible = columnOrder.filter(id => newVisibleColumnIds.has(id));
      const newColumns = newVisibleArray.filter(id => !columnOrder.includes(id));
      
      setColumnOrder([...orderedVisible, ...newColumns]);
    }
  };

  const filteredItems = useTableFilters(items, filters);

  if (isLoading) {
    return <Typography>Načítání...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <FilterBar
        config={itemFilterConfig}
        filters={filters}
        onFiltersChange={setFilters}
        columns={itemColumns}
        visibleColumnIds={visibleColumnIds}
        onVisibleColumnsChange={handleVisibleColumnsChange} // ✅ Use the handler
        defaultColumnIds={defaultVisibleColumnsItem} // ✅ Pass the array, not the handler
        actions={[
          {
            id: 'add-item',
            label: 'Přidat položku',
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