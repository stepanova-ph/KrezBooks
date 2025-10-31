import DescriptionIcon from "@mui/icons-material/Description";
import { useInvoices } from "../../../hooks/useInvoices";
import InvoicesList, { invoiceColumns } from "../invoice/InvoicesList";
import {
  invoiceFilterConfig,
  initialInvoiceFilterState,
  defaultVisibleColumnsInvoice,
} from "../../../config/invoiceFilterConfig";
import { ListTabComponent } from "../common/ListTabComponent";

function InvoicesTab() {
  const { data: invoices = [], isLoading } = useInvoices();

  return (
    <ListTabComponent
      data={invoices}
      isLoading={isLoading}
      loadingText="Načítám doklady..."
      filterConfig={invoiceFilterConfig}
      initialFilterState={initialInvoiceFilterState}
      defaultVisibleColumns={defaultVisibleColumnsInvoice}
      columns={invoiceColumns}
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
      renderList={({ data, visibleColumnIds, columnOrder, onColumnOrderChange, orderBy }) => (
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
