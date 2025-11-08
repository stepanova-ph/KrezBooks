import { TableCell } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { Invoice } from "../../../types/database";
import { DataTable, Column, ContextMenuAction } from "../common/table/DataTable";
import type { OrderByConfig } from "../common/filtering/ColumnPickerButton";
import { useDeleteInvoice } from "../../../hooks/useInvoices";
import { ViewInvoiceDialog } from "./ViewInvoiceDialog";
import { AlertDialog } from "../common/dialog/AlertDialog";
import { useState } from "react";
import { useTotalByInvoiceNumberVat } from "../../../hooks/useStockMovement";

interface InvoicesListProps {
  invoices: Invoice[];
  visibleColumnIds: Set<string>;
  columnOrder?: string[];
  onColumnOrderChange?: (newOrder: string[]) => void;
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
  const deleteInvoice = useDeleteInvoice();
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
  } | null>(null);

  const handleRowClick = (invoice: Invoice) => {
    setViewingInvoice(invoice)
  };

  const handleDelete = async (invoice: Invoice) => {
    try {
      await deleteInvoice.mutateAsync(invoice.number);
      setAlertDialog({
        open: true,
        title: "Úspěch",
        message: `Doklad ${invoice.number} byl úspěšně smazán.`,
      });
    } catch (error) {
      console.error("Chyba při mazání dokladu:", error);
      setAlertDialog({
        open: true,
        title: "Chyba",
        message: `Chyba při mazání dokladu: ${(error as Error).message}`,
      });
    }
  };

  const contextMenuActions: ContextMenuAction<Invoice>[] = [
    {
      id: "view",
      label: "Zobrazit doklad",
      icon: <VisibilityIcon fontSize="small" />,
      onClick: (invoice) => setViewingInvoice(invoice),
    },
    {
      id: "delete",
      label: "Smazat",
      icon: <DeleteIcon fontSize="small" />,
      onClick: handleDelete,
      requireConfirm: true,
      confirmMessage: (invoice) =>
        `Opravdu chcete smazat doklad "${invoice.number}"?\n\nTato akce také smaže všechny pohyby skladu související s tímto dokladem.`,
      divider: true,
    },
  ];

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
          return (invoice.total_with_vat?.toFixed(2) || "0.00") + " Kč";

      default:
        return "";
    }
  };

  return (
    <>
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
        contextMenuActions={contextMenuActions}
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

      {viewingInvoice && (
        <ViewInvoiceDialog
          open={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          invoiceNumber={viewingInvoice.number}
        />
      )}

      {alertDialog && (
        <AlertDialog
          open={alertDialog.open}
          title={alertDialog.title}
          message={alertDialog.message}
          onConfirm={() => setAlertDialog(null)}
        />
      )}
    </>
  );
}

export default InvoicesList;