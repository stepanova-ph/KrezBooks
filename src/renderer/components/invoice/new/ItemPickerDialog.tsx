import { TableCell, Box, FormControlLabel, Checkbox } from "@mui/material";
import { useState } from "react";
import { useItems } from "../../../../hooks/useItems";
import { Item } from "../../../../types/database";
import { Column } from "../../common/table/DataTable";
import { PickerDialog } from "../../common/dialog/PickerDialog";
import { formatVatRateShort } from "../../../../utils/formattingUtils";
import { useTableFilters } from "../../../../hooks/useTableFilters";
import {
	initialPickerFilterState,
	itemPickerFilterConfig,
} from "../../../../config/pickerFilterConfig";

interface ItemPickerDialogProps {
	open: boolean;
	onClose: () => void;
	onSelect: (item: Item) => void;
	selectedItemEans?: Set<String>;
}

const pickerColumns: Column[] = [
	{ id: "ean", label: "EAN", minWidth: 100 },
	{ id: "name", label: "Název", minWidth: 200 },
	{ id: "category", label: "Kategorie", minWidth: 100 },
	{ id: "unit_of_measure", label: "Jednotka", minWidth: 80, align: "center" },
	{ id: "vat_rate", label: "DPH", minWidth: 60, align: "center" },
];

export function ItemPickerDialog({
	open,
	onClose,
	onSelect,
	selectedItemEans,
}: ItemPickerDialogProps) {
	const { data: allItems = [] } = useItems();
	const [filters, setFilters] = useState<{ search: string }>(
		initialPickerFilterState,
	);
	const [hideSelected, setHideSelected] = useState(false);

	const filteredItems = useTableFilters(
		allItems,
		filters,
		itemPickerFilterConfig,
	);

	// Apply hide selected filter
	const displayItems = hideSelected
		? filteredItems.filter((item) => !selectedItemEans?.has(item.ean))
		: filteredItems;

	const renderRow = (item: Item, visibleColumns: Column[]) => {
		const isSelected = selectedItemEans?.has(item.ean) || false;
		return visibleColumns.map((col) => {
			let content;
			switch (col.id) {
				case "ean":
					content = item.ean;
					break;
				case "name":
					content = item.name;
					break;
				case "category":
					content = item.category || "-";
					break;
				case "unit_of_measure":
					content = item.unit_of_measure;
					break;
				case "vat_rate":
					content = formatVatRateShort(item.vat_rate);
					break;
				default:
					content = "-";
			}

			return (
				<TableCell
					key={col.id}
					align={col.align}
					sx={{
						bgcolor: isSelected ? "action.selected" : undefined,
						fontWeight: isSelected ? "bold" : undefined,
					}}
				>
					{content}
				</TableCell>
			);
		});
	};

	return (
		<PickerDialog
			open={open}
			onClose={onClose}
			onSelect={onSelect}
			title="Vybrat položku"
			columns={pickerColumns}
			data={displayItems}
			getRowKey={(item) => item.ean}
			renderRow={renderRow}
			emptyMessage="Žádné položky nenalezeny"
			searchPlaceholder="EAN, název, kategorie..."
			filterValue={filters.search || ""}
			onFilterChange={(value) => setFilters({ ...filters, search: value })}
			filterActions={
				<FormControlLabel
					control={
						<Checkbox
							checked={hideSelected}
							onChange={(e) => setHideSelected(e.target.checked)}
							size="small"
						/>
					}
					label="Skrýt vybrané"
					sx={{ ml: 1, mr: 0 }}
				/>
			}
		/>
	);
}
