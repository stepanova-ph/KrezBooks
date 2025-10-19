import { Box, TableCell, Typography } from "@mui/material";
import { useState } from "react";
import { useDeleteItem } from "../../../hooks/useItems";
import { Item } from "../../../types/database";
import {
  formatPrice,
  formatVatRateShort,
} from "../../../utils/formattingUtils";
import { Column, DataTable, ContextMenuAction } from "../common/DataTable";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EditItemForm from "./EditItemForm";

interface ItemsListProps {
  items: Item[];
  visibleColumnIds: Set<string>;
  columnOrder?: string[];
  onColumnOrderChange?: (newOrder: string[]) => void;
}

export const itemColumns: Column[] = [
  { id: "ean", label: "EAN", minWidth: 100, align: "center" as const },
  { id: "name", label: "Název", minWidth: 200 },
  {
    id: "category",
    label: "Kategorie",
    minWidth: 100,
    align: "center" as const,
  },
  { id: "unit", label: "Jednotka", minWidth: 0, align: "center" as const },
  { id: "vat", label: "DPH", minWidth: 15, align: "center" as const },
  {
    id: "sale_price_group1",
    label: "Cena (Sk. 1)",
    minWidth: 80,
    align: "right" as const,
  },
  {
    id: "sale_price_group2",
    label: "Cena (Sk. 2)",
    minWidth: 80,
    align: "right" as const,
  },
  {
    id: "sale_price_group3",
    label: "Cena (Sk. 3)",
    minWidth: 80,
    align: "right" as const,
  },
  {
    id: "sale_price_group4",
    label: "Cena (Sk. 4)",
    minWidth: 80,
    align: "right" as const,
  },
  { id: "note", label: "Poznámka", hidden: true },
];

function ItemsList({
  items,
  visibleColumnIds,
  columnOrder,
  onColumnOrderChange,
}: ItemsListProps) {
  const deleteItem = useDeleteItem();
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const handleDelete = async (item: Item) => {
    try {
      await deleteItem.mutateAsync(item.ean);
    } catch (error) {
      console.error("Chyba při mazání položky:", error);
      alert("Chyba: " + (error as Error).message);
    }
  };

  // Define context menu actions
  const contextMenuActions: ContextMenuAction<Item>[] = [
    {
      id: "edit",
      label: "Upravit",
      icon: <EditIcon fontSize="small" />,
      onClick: (item) => setEditingItem(item),
    },
    {
      id: "delete",
      label: "Smazat",
      icon: <DeleteIcon fontSize="small" />,
      onClick: handleDelete,
      requireConfirm: true,
      confirmMessage: (item) => `Opravdu chcete smazat položku "${item.name}"?`,
      divider: true,
    },
  ];

  const getCellContent = (item: Item, columnId: string) => {
    switch (columnId) {
      case "ean":
        return item.ean;

      case "name":
        return (
          <Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, lineHeight: 1.4 }}
            >
              {item.name}
            </Typography>
            {item.note && visibleColumnIds.has("note") && (
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                {item.note}
              </Typography>
            )}
          </Box>
        );

      case "category":
        return item.category ? String(item.category) : "-";

      case "unit":
        return item.unit_of_measure;

      case "vat":
        return formatVatRateShort(item.vat_rate);

      case "sale_price_group1":
        return formatPrice(item.sale_price_group1);

      case "sale_price_group2":
        return formatPrice(item.sale_price_group2);

      case "sale_price_group3":
        return formatPrice(item.sale_price_group3);

      case "sale_price_group4":
        return formatPrice(item.sale_price_group4);
      default:
        console.log(columnId)
        return "-";
    }
  };

  return (
    <>
      <DataTable
        columns={itemColumns}
        data={items}
        emptyMessage='Žádné položky. Klikněte na "Přidat položku" pro vytvoření nové.'
        getRowKey={(item) => item.ean}
        getCellContent={getCellContent}
        contextMenuActions={contextMenuActions}
        visibleColumnIds={visibleColumnIds}
        columnOrder={columnOrder}
        onColumnOrderChange={onColumnOrderChange}
        renderRow={(item, visibleColumns) => (
          <>
            {visibleColumns.filter((col) => !col.hidden).map((column) => (
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
      />
      {editingItem && (
        <EditItemForm
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          item={editingItem}
        />
      )}
    </>
  );
}

export default ItemsList;