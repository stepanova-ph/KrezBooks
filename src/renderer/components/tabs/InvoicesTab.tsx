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
import { FilterConfig, FilterState } from "../../../types/filter";
import { useState, useCallback } from "react";
import { ContactPickerDialog } from "../invoice/new/ContactPickerDialog";
import type { Contact } from "../../../types/database";

function InvoicesTab() {
	const { data: invoices = [], isLoading } = useInvoices();
	const [dynamicFilters, setDynamicFilters] = useState<string[]>([]);
	const [contactPickerOpen, setContactPickerOpen] = useState(false);
	const [filters, setFilters] = useState<FilterState>(initialInvoiceFilterState);

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

	const handleSelectContact = (contact: Contact) => {
		setFilters(prev => ({
			...prev,
			ico: contact.ico,
			modifier: contact.modifier,
		}));
		setContactPickerOpen(false);
	};

	return (
		<>
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
						id: "open_contact_picker",
						label: "IČO",
						onClick: () => setContactPickerOpen(true),
					},
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
				filters={filters}
				onFiltersChange={setFilters}
			/>

			<ContactPickerDialog
				open={contactPickerOpen}
				onClose={() => setContactPickerOpen(false)}
				onSelect={handleSelectContact}
			/>
		</>
	);
}

export default InvoicesTab;