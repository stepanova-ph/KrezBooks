import React from "react";
import { Box, Grid, IconButton, Tooltip, Button } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import { InvoiceHeader } from "../invoice/new/InvoiceHeader";
import { InvoiceContactInfo } from "../invoice/new/InvoiceContactInfo";
import { InvoiceItemsList } from "../invoice/new/InvoiceItemsList";
import { FormSection } from "../common/form/FormSection";
import { ItemPickerDialog } from "../invoice/new/ItemPickerDialog";
import { ItemAmountPriceDialog } from "../invoice/new/ItemAmountPriceDialog";
import { ContactPickerDialog } from "../invoice/new/ContactPickerDialog";
import { useInvoiceForm } from "../../../hooks/useInvoiceForm";
import { useInvoiceDialogs } from "../../../hooks/useInvoiceDialogs";
import { useCreateInvoice } from "../../../hooks/useInvoices";
import { useCreateStockMovement } from "../../../hooks/useStockMovement";
import type { Item, Contact, CreateInvoiceInput } from "../../../types/database";
import type { InvoiceItem } from "../../../hooks/useInvoiceForm";

function NewInvoiceTab() {
  const form = useInvoiceForm();
  const dialogs = useInvoiceDialogs();
  const createInvoice = useCreateInvoice();
  const createStockMovement = useCreateStockMovement();

  const isType5 = form.formData.type === 5;

  const handleSelectItem = (item: Item) => {
    dialogs.itemPicker.closeDialog();
    dialogs.amountPrice.openDialog(item);
  };

  const handleEditItem = (item: InvoiceItem) => {
    const index = form.invoiceItems.findIndex((i) => i.ean === item.ean);
    dialogs.amountPrice.openDialog(item, {
      amount: item.amount,
      price: item.sale_price,
      p_group_index: item.p_group_index,
      index,
    });
  };

  const handleConfirmAmountPrice = (
    amount: number,
    price: number,
    p_group_index: number
  ) => {
    if (!dialogs.amountPrice.selectedItem) return;

    if (dialogs.amountPrice.editingItemIndex !== null) {
      form.handleUpdateItem(
        dialogs.amountPrice.editingItemIndex,
        dialogs.amountPrice.selectedItem,
        amount,
        price,
        p_group_index
      );
      dialogs.amountPrice.closeDialog(false);
    } else {
      form.handleAddItem(
        dialogs.amountPrice.selectedItem,
        amount,
        price,
        p_group_index
      );
      dialogs.amountPrice.closeDialog(true);
    }
  };

  const handleCloseAmountPriceDialog = () => {
    const shouldReopenItemPicker = dialogs.amountPrice.editingItemIndex === null;
    dialogs.amountPrice.closeDialog(shouldReopenItemPicker);
  };

  const handleSelectContact = (contact: Contact) => {
    form.handleSelectContact(contact);
    dialogs.contactPicker.closeDialog();
  };

  const handleSubmit = async (data: CreateInvoiceInput) => {
    if (!form.handleValidate()) {
      alert("Opravte chyby ve formuláři");
      return;
    }

    if (form.invoiceItems.length === 0) {
      alert("Přidejte alespoň jednu položku");
      return;
    }

    try {
      await createInvoice.mutateAsync(data);

      // await Promise.all(
      //   form.invoiceItems.map(item =>
      //     createStockMovement.mutateAsync({
      //       invoice_number: form.formData.number,
      //       item_ean: item.ean,
      //       amount: item.amount.toString(),
      //       price_per_unit: item.sale_price.toString(),
      //       vat_rate: item.vat_rate,
      //     })
      //   )
      // );

      form.handleReset();
      alert("Doklad byl úspěšně vytvořen");
    } catch (error) {
      console.error("Failed to create invoice:", error);
      alert(`Chyba při vytváření dokladu: ${(error as Error).message}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid container item xs={12} spacing={3}>
          <Grid item xs={12} md={isType5 ? 12 : 4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <InvoiceHeader
                  type={form.formData.type}
                  number={form.formData.number}
                  paymentMethod={form.formData.payment_method}
                  dateIssue={form.formData.date_issue}
                  dateTax={form.formData.date_tax}
                  dateDue={form.formData.date_due}
                  variableSymbol={form.formData.variable_symbol}
                  errors={form.errors}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              </Grid>

              {!isType5 && (
                <Grid item xs={12}>
                  <InvoiceContactInfo
                    type={form.formData.type}
                    ico={form.formData.ico}
                    modifier={form.formData.modifier}
                    dic={form.formData.dic}
                    companyName={form.formData.company_name}
                    street={form.formData.street}
                    city={form.formData.city}
                    postalCode={form.formData.postal_code}
                    phone={form.formData.phone}
                    email={form.formData.email}
                    bankAccount={form.formData.bank_account}
                    errors={form.errors}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    onOpenContactPicker={dialogs.contactPicker.openDialog}
                  />
                </Grid>
              )}
            </Grid>
          </Grid>

          <Grid
            item
            xs={12}
            md={isType5 ? 12 : 8}
            marginX={isType5 ? "10vh" : 0}
            minHeight={"100%"}
          >
            <FormSection
              hideDivider
              title="Položky dokladu"
              actions={
                <Tooltip title="Přidat položku ze skladu">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={dialogs.itemPicker.openDialog}
                  >
                    <InventoryIcon sx={{ width: 24 }} />
                  </IconButton>
                </Tooltip>
              }
            >
              <InvoiceItemsList
                items={form.invoiceItems}
                onEditItem={handleEditItem}
                onDeleteItem={form.handleDeleteItem}
              />
            </FormSection>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button variant="outlined" onClick={form.handleReset}>
              Zrušit
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={createInvoice.isPending || form.invoiceItems.length === 0}
            >
              Vytvořit doklad
            </Button>
          </Box>
        </Grid>
      </Grid>

      <ItemPickerDialog
        open={dialogs.itemPicker.open}
        onClose={dialogs.itemPicker.closeDialog}
        onSelect={handleSelectItem}
      />

      <ItemAmountPriceDialog
        open={dialogs.amountPrice.open}
        onClose={handleCloseAmountPriceDialog}
        onConfirm={handleConfirmAmountPrice}
        item={dialogs.amountPrice.selectedItem}
        invoiceType={form.formData.type}
        contactPriceGroup={form.selectedContact?.price_group}
        initialAmount={dialogs.amountPrice.editingItemData?.amount}
        initialPrice={dialogs.amountPrice.editingItemData?.price}
        initialPriceGroup={dialogs.amountPrice.editingItemData?.p_group_index}
      />

      <ContactPickerDialog
        open={dialogs.contactPicker.open}
        onClose={dialogs.contactPicker.closeDialog}
        onSelect={handleSelectContact}
      />
    </Box>
  );
}

export default NewInvoiceTab;