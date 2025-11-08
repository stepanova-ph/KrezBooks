import Inventory2Icon from "@mui/icons-material/Inventory2";
import { useItems, useItemCategories } from "../../../hooks/useItems";
import ItemsList, { itemColumns } from "../items/ItemsList";
import CreateItemForm from "../items/CreateItemForm";
import {
	itemFilterConfig,
	initialItemFilterState,
	defaultVisibleColumnsItem,
} from "../../../config/itemFilterConfig";
import { ListTabComponent } from "../common/ListTabComponent";
import type { FilterConfig } from "../../../types/filter";

function InventoryTab() {
	const { data: items = [], isLoading } = useItems();
	const { data: categories = [] } = useItemCategories();

	const buildDynamicConfig = (baseConfig: FilterConfig) => {
		const config = { ...baseConfig };
		const categoryFilter = config.filters.find((f) => f.id === "category");
		if (categoryFilter && categoryFilter.type === "multiselect") {
			categoryFilter.options = categories.map((cat) => ({
				value: cat,
				label: cat,
			}));
		}
		return config;
	};

	return (
		<ListTabComponent
			storageKey="COLUMN_ORDER_INVENTORY"
			tabKey="inventory"
			data={items}
			isLoading={isLoading}
			loadingText="Načítám sklad..."
			filterConfig={itemFilterConfig}
			initialFilterState={initialItemFilterState}
			defaultVisibleColumns={defaultVisibleColumnsItem}
			columns={itemColumns}
			dynamicFilterConfig={buildDynamicConfig}
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
			renderList={({
				data,
				visibleColumnIds,
				columnOrder,
				onColumnOrderChange,
				orderBy,
			}) => (
				<ItemsList
					items={data}
					visibleColumnIds={visibleColumnIds}
					columnOrder={columnOrder}
					onColumnOrderChange={onColumnOrderChange}
					orderBy={orderBy}
				/>
			)}
		/>
	);
}

export default InventoryTab;
