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
import { IconButton, Badge } from "@mui/material";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";

function InvoicesTab() {
	const { data: invoices = [], isLoading } = useInvoices();
	const [dynamicFilters, setDynamicFilters] = useState<string[]>([]);
	const [contactPickerOpen, setContactPickerOpen] = useState(false);
	const [filters, setFilters] = useState<FilterState>(
		initialInvoiceFilterState,
	);

	const dynamicFilterConfig = useCallback(
		(baseConfig: FilterConfig) => {
			const configFilters = [...baseConfig.filters];

			if (dynamicFilters.includes("date_due_aggregate")) {
				configFilters.push(dateDueFilter);
			}
			if (dynamicFilters.includes("date_tax_aggregate")) {
				configFilters.push(dateTaxFilter);
			}

			return { filters: configFilters };
		},
		[dynamicFilters],
	);

	const addDynamicFilter = (filterId: string) => {
		if (!dynamicFilters.includes(filterId)) {
			setDynamicFilters([...dynamicFilters, filterId]);
		}
	};

	const removeDynamicFilter = useCallback((filterId: string) => {
		setDynamicFilters((prev) => prev.filter((id) => id !== filterId));
	}, []);

	const handleToggleContact = (contact: Contact) => {
		setFilters((prev) => {
			const selectedContacts = prev.selectedContacts || [];
			const contactKey = { ico: contact.ico, modifier: contact.modifier };

			const existingIndex = selectedContacts.findIndex(
				(c) => c.ico === contactKey.ico && c.modifier === contactKey.modifier,
			);

			if (existingIndex !== -1) {
				return {
					...prev,
					selectedContacts: selectedContacts.filter(
						(_, i) => i !== existingIndex,
					),
				};
			} else {
				return {
					...prev,
					selectedContacts: [...selectedContacts, contactKey],
				};
			}
		});
	};

	const selectedContacts = filters.selectedContacts || [];
	const hasContactFilter = selectedContacts.length > 0;

	return (
		<>
			<ListTabComponent
				storageKey="COLUMN_ORDER_INVOICES"
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
					// {
					// 	id: "add-invoice",
					// 	label: "Vytvořit doklad",
					// 	startIcon: <DescriptionIcon />,
					// 	onClick: () => {
					// 		console.log("Navigate to create invoice");
					// 	},
					// },
				]}
				customFilterElements={
					<Badge
						badgeContent={selectedContacts.length}
						color="primary"
						sx={{
							"& .MuiBadge-badge": {
								right: -3,
								top: 3,
							},
						}}
					>
						<IconButton
							size="medium"
							onClick={() => setContactPickerOpen(true)}
							color={hasContactFilter ? "primary" : "default"}
							sx={{
								border: (theme) => `1px solid ${theme.palette.divider}`,
								borderRadius: 1,
							}}
						>
							<PersonSearchIcon />
						</IconButton>
					</Badge>
				}
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
				onToggleSelect={handleToggleContact}
				selectedContacts={selectedContacts}
			/>
		</>
	);
}

export default InvoicesTab;
