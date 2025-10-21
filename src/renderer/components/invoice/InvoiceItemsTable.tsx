import { Box, IconButton, Tooltip } from "@mui/material";
import { DataTable } from "../common/table/DataTable";
import { FormSection } from "../common/form/FormSection";
import InventoryIcon from "@mui/icons-material/Inventory";
import type { Column } from "../common/table/DataTable";

interface InvoiceItem {
  ean: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  vatRate: number;
  total: number;
}

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  onSelectItem: () => void;
}

const dummyItems: InvoiceItem[] = [
  {
    ean: "8594163480029",
    name: "Testovací položka 1",
    quantity: 5,
    pricePerUnit: 150.00,
    vatRate: 21,
    total: 750.00,
  },
  {
    ean: "8594163480036",
    name: "Testovací položka 2",
    quantity: 2,
    pricePerUnit: 299.99,
    vatRate: 21,
    total: 599.98,
  },
];

const itemColumns: Column[] = [
  {
    id: "ean",
    label: "EAN",
    // accessor: "ean",
    width: 150,
  },
  {
    id: "name",
    label: "Název",
    // accessor: "name",
    width: 300,
  },
  {
    id: "quantity",
    label: "Množství",
    // accessor: "quantity",
    width: 100,
    align: "right",
  },
  {
    id: "pricePerUnit",
    label: "Cena/ks",
    // accessor: (row) => `${row.pricePerUnit.toFixed(2)} Kč`,
    width: 120,
    align: "right",
  },
  {
    id: "vatRate",
    label: "DPH %",
    // accessor: (row) => `${row.vatRate}%`,
    width: 100,
    align: "right",
  },
  {
    id: "total",
    label: "Celkem",
    // accessor: (row) => `${row.total.toFixed(2)} Kč`,
    width: 120,
    align: "right",
  },
];

export function InvoiceItemsTable({ items, onSelectItem }: InvoiceItemsTableProps) {
  const displayItems = items.length > 0 ? items : dummyItems;

  return (
    <FormSection
      title="Položky dokladu"
      actions={
        <Tooltip title="Přidat položku ze skladu">
          <IconButton size="small" onClick={onSelectItem} color="primary">
            <InventoryIcon />
          </IconButton>
        </Tooltip>
      }
    >
      <Box sx={{ width: "100%", mt: 2 }}>
        <DataTable
          data={displayItems}
          columns={itemColumns}
          onRowClick={(item) => console.log("Kliknuto na položku:", item)}
        />
      </Box>
    </FormSection>
  );
}