import DescriptionIcon from "@mui/icons-material/Description";
import { useInvoices } from "../../../hooks/useInvoices";
import InvoicesList, { invoiceColumns } from "../invoice/InvoicesList";
import {
	invoiceFilterConfig,
	initialInvoiceFilterState,
	defaultVisibleColumnsInvoice,
	dateDueFilter,
	dateTaxFilter,
} from "../../../config/invoiceFilterConfig";
import { ListTabComponent } from "../common/ListTabComponent";
import { FilterConfig } from "../../../types/filter";
import { useState, useCallback } from "react";

function InvoicesTab() {
	const { data: invoices = [], isLoading } = useInvoices();
	const [dynamicFilters, setDynamicFilters] = useState<string[]>([]);

	const dynamicFilterConfig = useCallback(
		(baseConfig: FilterConfig) => {
			const filters = [...baseConfig.filters];

			// Add dynamic filters if they're in the list
			if (dynamicFilters.includes("date_due_aggregate")) {
				filters.push(dateDueFilter);
			}
			if (dynamicFilters.includes("date_tax_aggregate")) {
				filters.push(dateTaxFilter);
			}

			return { filters };
		},
		[dynamicFilters],
	);

	const addDynamicFilter = (filterId: string) => {
		if (!dynamicFilters.includes(filterId)) {
			setDynamicFilters([...dynamicFilters, filterId]);
		}
	};

	const removeDynamicFilter = useCallback((filterId: string) => {
		setDynamicFilters(prev => prev.filter((id) => id !== filterId));
	}, []);

	return (
		<ListTabComponent
			storageKey="COLUMN_ORDER_INVENTORY"
			tabKey="invoices"
			data={invoices}
			isLoading={isLoading}
			loadingText="Načítám doklady..."
			filterConfig={invoiceFilterConfig}
			initialFilterState={initialInvoiceFilterState}
			defaultVisibleColumns={defaultVisibleColumnsInvoice}
			columns={invoiceColumns}
			dynamicFilterConfig={dynamicFilterConfig}
			filterActions={[
				{
					id: "add_date_due_filter",
					label: "Datum splatnosti",
					onClick: () => addDynamicFilter("date_due_aggregate"),
				},
				{
					id: "add_date_tax_filter",
					label: "Datum zdanění",
					onClick: () => addDynamicFilter("date_tax_aggregate"),
				},
			]}
			onRemoveDynamicFilter={removeDynamicFilter}
			actions={[
				{
					id: "add-invoice",
					label: "Vytvořit doklad",
					startIcon: <DescriptionIcon />,
					onClick: () => {
						console.log("Navigate to create invoice");
					},
				},
			]}
			renderList={({
				data,
				visibleColumnIds,
				columnOrder,
				onColumnOrderChange,
				orderBy,
			}) => (
				<InvoicesList
					invoices={data}
					visibleColumnIds={visibleColumnIds}
					columnOrder={columnOrder}
					onColumnOrderChange={onColumnOrderChange}
					orderBy={orderBy}
				/>
			)}
		/>
	);
}

export default InvoicesTab;
