import { Box, Grid } from "@mui/material";
import { Dialog } from "../common/dialog/Dialog";
import { useInvoice } from "../../../hooks/useInvoices";
import { useStockMovementsByInvoice } from "../../../hooks/useStockMovement";
import { useItems } from "../../../hooks/useItems";
import { FormSection } from "../common/form/FormSection";
import { InvoiceHeader } from "./InvoiceHeader";
import { InvoiceContactInfo } from "./InvoiceContactInfo";
import { InvoiceItemsList } from "./InvoiceItemsList";
import { Loading } from "../layout/Loading";
import type { InvoiceItem } from "../../../hooks/useInvoiceForm";

interface ViewInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceNumber: string;
}

export function ViewInvoiceDialog({ open, onClose, invoiceNumber }: ViewInvoiceDialogProps) {
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(invoiceNumber);
  const { data: movements = [], isLoading: movementsLoading } = useStockMovementsByInvoice(invoiceNumber);
  const { data: allItems = [] } = useItems();

  const isLoading = invoiceLoading || movementsLoading;
  const isType5 = invoice?.type === 5;

  // Transform stock movements into InvoiceItems
  const invoiceItems: InvoiceItem[] = movements.map((movement) => {
    const item = allItems.find((i) => i.ean === movement.item_ean);
    return {
      ean: movement.item_ean,
      name: item?.name || movement.item_ean,
      category: item?.category || "",
      unit_of_measure: item?.unit_of_measure || "ks",
      vat_rate: movement.vat_rate,
      amount: Number(movement.amount),
      sale_price: Number(movement.price_per_unit),
      total: Number(movement.amount) * Number(movement.price_per_unit),
      p_group_index: 1,
      note: item?.note,
      sale_price_group1: item?.sale_price_group1 || 0,
      sale_price_group2: item?.sale_price_group2 || 0,
      sale_price_group3: item?.sale_price_group3 || 0,
      sale_price_group4: item?.sale_price_group4 || 0,
    };
  });

  if (!invoice) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Zobrazit doklad ${invoice.number}`}
      maxWidth="lg"
    >
      {isLoading ? (
        <Loading text="Načítám doklad..." />
      ) : (
        <Box sx={{ py: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={isType5 ? 12 : 4}>
              <Grid container spacing={3} px={isType5 ? 8 : 0}>
                <Grid item xs={12}>
                  <InvoiceHeader
                    type={invoice.type}
                    number={invoice.number}
                    paymentMethod={invoice.payment_method}
                    dateIssue={invoice.date_issue}
                    dateTax={invoice.date_tax}
                    dateDue={invoice.date_due}
                    variableSymbol={invoice.variable_symbol}
                    errors={{}}
                    onChange={() => {}}
                    onBlur={() => {}}
                    disabled={true}
                  />
                </Grid>

                {!isType5 && (
                  <Grid item xs={12}>
                    <InvoiceContactInfo
                      type={invoice.type}
                      ico={invoice.ico || ""}
                      modifier={invoice.modifier}
                      dic={invoice.dic || ""}
                      companyName={invoice.company_name || ""}
                      street={invoice.street || ""}
                      city={invoice.city || ""}
                      postalCode={invoice.postal_code || ""}
                      phone={invoice.phone || ""}
                      email={invoice.email || ""}
                      bankAccount={invoice.bank_account || ""}
                      errors={{}}
                      onChange={() => {}}
                      onBlur={() => {}}
                      onOpenContactPicker={() => {}}
                      disabled={true}
                    />
                  </Grid>
                )}
              </Grid>
            </Grid>

            <Grid item xs={12} md={isType5 ? 12 : 8} marginX={isType5 ? "10vh" : 0}>
              <FormSection title="Položky dokladu" hideDivider>
                <InvoiceItemsList
                  items={invoiceItems}
                  onEditItem={() => {}}
                  onDeleteItem={() => {}}
                  readOnly={true}
                />
              </FormSection>
            </Grid>
          </Grid>
        </Box>
      )}
    </Dialog>
  );
}