import { TableCell } from "@mui/material";
import type { Invoice } from "../../../types/database";
import { DataTable, Column } from "../common/table/DataTable";
import type { OrderByConfig } from "../common/filtering/ColumnPickerButton";

interface InvoicesListProps {
  invoices: Invoice[];
  visibleColumnIds: Set<string>;
  columnOrder?: string[];
  onColumnOrderChange?: (newOrder: string[]) => void;
  /** NEW: applied by DataTable for sorting */
  orderBy?: OrderByConfig;
}

export const invoiceColumns: Column[] = [
  { id: "number", label: "Číslo dokladu", minWidth: 120 },
  { id: "type", label: "Typ", minWidth: 150 },
  { id: "date_issue", label: "Datum vystavení", minWidth: 120 },
  { id: "company_name", label: "Obchodní partner", minWidth: 200 },
  {
    id: "total",
    label: "Celková částka",
    minWidth: 120,
    align: "right" as const,
  },
];

function InvoicesList({
  invoices,
  visibleColumnIds,
  columnOrder,
  onColumnOrderChange,
  orderBy,
}: InvoicesListProps) {
  const handleRowClick = (invoice: Invoice) => {
    console.log("Kliknuto na doklad:", invoice);
  };

  const getCellContent = (invoice: Invoice, columnId: string) => {
    switch (columnId) {
      case "number":
        return invoice.number;
      case "type": {
        const types: Record<number, string> = {
          1: "Nákup (hotovost)",
          2: "Nákup (faktura)",
          3: "Prodej (hotovost)",
          4: "Prodej (faktura)",
          5: "Korekce skladu",
        };
        return types[invoice.type] || "Neznámý";
      }
      case "date_issue":
        return invoice.date_issue;
      case "company_name":
        return invoice.company_name || "-";
      case "total":
        // TODO: Calculate total from invoice items
        return "0.00 Kč";
      default:
        return "";
    }
  };

  return (
    <DataTable
      data={invoices}
      columns={invoiceColumns}
      visibleColumnIds={visibleColumnIds}
      onRowClick={handleRowClick}
      emptyMessage="Žádné doklady. Klikněte na 'Vytvořit doklad' pro vytvoření nového."
      columnOrder={columnOrder}
      onColumnOrderChange={onColumnOrderChange}
      getRowKey={(invoice) => invoice.number}
      orderBy={orderBy}
      getCellContent={getCellContent}
      renderRow={(invoice, visibleColumns) => (
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
              {getCellContent(invoice, column.id)}
            </TableCell>
          ))}
        </>
      )}
    />
  );
}

export default InvoicesList;
