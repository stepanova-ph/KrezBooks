import { TableCell } from "@mui/material";
import { DataTable, Column } from "../common/table/DataTable";
import type { Item } from "../../../types/database";

interface InvoiceItem extends Item {
  sale_price: number;
  total: number;
}

interface InvoiceItemsListProps {
  items: InvoiceItem[];
}

const itemColumns: Column[] = [
  { id: "ean", label: "EAN", minWidth: 120 },
  { id: "name", label: "Název", minWidth: 200 },
  { id: "category", label: "Kategorie", minWidth: 120 },
  { id: "unit_of_measure", label: "Jednotka", minWidth: 80, align: "center" },
  { id: "vat_rate", label: "DPH %", minWidth: 70, align: "right" },
  { id: "sale_price", label: "Cena", minWidth: 100, align: "right" },
  { id: "total", label: "Celkem", minWidth: 120, align: "right" },
];

export function InvoiceItemsList({ items }: InvoiceItemsListProps) {
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
        return `${item.vat_rate}%`;
      case "sale_price":
        return `${item.sale_price.toFixed(2)} Kč`;
      case "total":
        return `${item.total.toFixed(2)} Kč`;
      default:
        return "";
    }
  };

  return (
    <DataTable
      columns={itemColumns}
      data={items}
      visibleColumnIds={new Set(itemColumns.map((c) => c.id))}
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
}