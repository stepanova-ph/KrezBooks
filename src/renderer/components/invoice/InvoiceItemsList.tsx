import { TableCell, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BadgeIcon from "@mui/icons-material/Badge";
import {
	DataTable,
	Column,
	ContextMenuAction,
} from "../common/table/DataTable";
import { formatVatRateShort } from "../../../utils/formattingUtils";
import type { InvoiceItem } from "../../../hooks/useInvoiceForm";
import { calculateTotalWithVat } from "../../../utils/formUtils";

interface InvoiceItemsListProps {
	items: InvoiceItem[];
	onEditItem: (item: InvoiceItem) => void;
	onDeleteItem: (item: InvoiceItem) => void;
	onOpenItemCard?: (item: InvoiceItem) => void;
	readOnly?: boolean;
	maxHeight?: string;
}

export const invoiceItemColumns: Column[] = [
	{ id: "ean", label: "EAN", minWidth: 120 },
	{ id: "name", label: "Název", minWidth: 200 },
	{ id: "amount", label: "Množství", minWidth: 100, align: "right" },
	{ id: "sale_price", label: "Cena", minWidth: 100, align: "right" },
	{ id: "vat_rate", label: "DPH %", minWidth: 70, align: "right" },
	{ id: "total", label: "Celkem s DPH", minWidth: 120, align: "right" },
];

export function InvoiceItemsList({
	items,
	onEditItem,
	onDeleteItem,
	onOpenItemCard,
	visibleColumnIds = new Set(invoiceItemColumns.map((c) => c.id)),
	readOnly = false,
	maxHeight,
}: InvoiceItemsListProps & { visibleColumnIds?: Set<string> }) {
	const contextMenuActions: ContextMenuAction<InvoiceItem>[] = readOnly
		? [
				...(onOpenItemCard
					? [
							{
								id: "card",
								label: "Otevřít kartu položky",
								icon: <BadgeIcon fontSize="small" />,
								onClick: onOpenItemCard,
							},
						]
					: []),
			]
		: [
				...(onOpenItemCard
					? [
							{
								id: "card",
								label: "Otevřít kartu položky",
								icon: <BadgeIcon fontSize="small" />,
								onClick: onOpenItemCard,
							},
						]
					: []),
				{
					id: "edit",
					label: "Upravit množství/cenu",
					icon: <EditIcon fontSize="small" />,
					onClick: onEditItem,
				},
				{
					id: "delete",
					label: "Odebrat z dokladu",
					icon: <DeleteIcon fontSize="small" />,
					onClick: onDeleteItem,
					requireConfirm: true,
					confirmMessage: (item) =>
						`Opravdu chcete odebrat "${item.name}" z dokladu?`,
					divider: true,
				},
			];

	const getCellContent = (item: InvoiceItem, columnId: string) => {
		switch (columnId) {
			case "ean":
				return item.ean;
			case "name":
				return item.name;
			case "category":
				return item.category || "-";
			case "unit_of_measure":
				return item.unit_of_measure;
			case "vat_rate":
				return formatVatRateShort(item.vat_rate);
			case "amount":
				return `${item.amount.toFixed(0)} ${item.unit_of_measure}`;
			case "sale_price":
				return `${item.sale_price.toFixed(2)} Kč`;
			case "total":
				return calculateTotalWithVat([item]).toFixed(2);
			default:
				return "";
		}
	};

	const content = (
		<DataTable
			disableDrag
			columns={invoiceItemColumns}
			data={items}
			visibleColumnIds={visibleColumnIds}
			contextMenuActions={contextMenuActions}
			renderRow={(item, visibleColumns) => (
				<>
					{visibleColumns.map((column) => (
						<TableCell
							key={column.id}
							align={column.align}
							style={{
								maxWidth: column.maxWidth,
								minWidth: column.minWidth,
								width: column.width,
							}}
						>
							{getCellContent(item, column.id)}
						</TableCell>
					))}
				</>
			)}
			getRowKey={(item) => item.ean}
			emptyMessage="Žádné položky"
		/>
	);

	if (maxHeight) {
		return <Box sx={{ maxHeight, overflow: "auto" }}>{content}</Box>;
	}

	return content;
}
