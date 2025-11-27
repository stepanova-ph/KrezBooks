import { TableCell } from "@mui/material";
import { useState } from "react";
import { useContacts } from "../../../../hooks/useContacts";
import { Contact } from "../../../../types/database";
import { Column } from "../../common/table/DataTable";
import { PickerDialog } from "../../common/dialog/PickerDialog";
import { useTableFilters } from "../../../../hooks/useTableFilters";
import {
	contactPickerFilterConfig,
	initialPickerFilterState,
} from "../../../../config/pickerFilterConfig";

interface ContactPickerDialogProps {
	open: boolean;
	onClose: () => void;
	onToggleSelect?: (contact: Contact) => void;
	onSelect?: (contact: Contact) => void;
	selectedContacts?: Array<{ ico: string; modifier: number }>;
	singleSelect?: boolean;
}

const pickerColumns: Column[] = [
	{ id: "ico", label: "IČO", minWidth: 75 },
	{ id: "modifier", label: "Mod", minWidth: 40, align: "center" },
	{ id: "company_name", label: "Název", minWidth: 200 },
	{ id: "dic", label: "DIČ", minWidth: 95 },
	{ id: "price_group", label: "Skupina", minWidth: 70, align: "center" },
];

export function ContactPickerDialog({
	open,
	onClose,
	onToggleSelect,
	onSelect,
	selectedContacts = [],
	singleSelect = false,
}: ContactPickerDialogProps) {
	const { data: allContacts = [] } = useContacts();
	const [filters, setFilters] = useState<{ search: string }>(
		initialPickerFilterState,
	);

	const isContactSelected = (contact: Contact) => {
		return selectedContacts.some(
			(c) => c.ico === contact.ico && c.modifier === contact.modifier,
		);
	};

	const filteredContacts = useTableFilters(
		allContacts,
		filters,
		contactPickerFilterConfig,
	);

	const sortedContacts = [...filteredContacts].sort((a, b) => {
		const aSelected = isContactSelected(a);
		const bSelected = isContactSelected(b);
		if (aSelected && !bSelected) return -1;
		if (!aSelected && bSelected) return 1;
		return 0;
	});

	const handleSelect = (contact: Contact) => {
		if (singleSelect) {
			if (onSelect) {
				onSelect(contact);
			}
			onClose();
		} else {
			if (onToggleSelect) {
				onToggleSelect(contact);
			}
		}
	};

	const renderRow = (
		contact: Contact,
		visibleColumns: Column[],
		isFocused: boolean,
	) => {
		const isSelected = !singleSelect && isContactSelected(contact);

		return visibleColumns.map((col) => {
			let content;
			switch (col.id) {
				case "ico":
					content = contact.ico;
					break;
				case "modifier":
					content = contact.modifier;
					break;
				case "company_name":
					content = contact.company_name;
					break;
				case "dic":
					content = contact.dic || "-";
					break;
				case "price_group":
					content = `Skupina ${contact.price_group}`;
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
			onSelect={handleSelect}
			title={singleSelect ? "Vybrat kontakt" : "Vybrat kontakty"}
			columns={pickerColumns}
			data={sortedContacts}
			getRowKey={(contact) => `${contact.ico}-${contact.modifier}`}
			renderRow={renderRow}
			emptyMessage="Žádné kontakty nenalezeny"
			searchPlaceholder="IČO, název, DIČ..."
			filterValue={filters.search || ""}
			onFilterChange={(value) => setFilters({ ...filters, search: value })}
			keepOpenOnSelect={!singleSelect}
		/>
	);
}
