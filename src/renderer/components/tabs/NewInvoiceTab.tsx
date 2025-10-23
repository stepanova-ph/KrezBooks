import React, { useState } from "react";
import { Box, Grid, IconButton, Tooltip } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import { InvoiceHeader } from "../invoice/InvoiceHeader";
import { InvoiceContactInfo } from "../invoice/InvoiceContactInfo";
import { InvoiceItemsList } from "../invoice/InvoiceItemsList";
import { FormSection } from "../common/form/FormSection";
import { ItemPickerDialog } from "../invoice/ItemPickerDialog";
import { ItemAmountPriceDialog } from "../invoice/ItemAmountPriceDialog";
import type { InvoiceType, Item } from "../../../types/database";

interface InvoiceItem extends Item {
  amount: number;
  sale_price: number;
  total: number;
}

function NewInvoiceTab() {
  const [formData, setFormData] = useState({
    number: "",
    type: 1 as InvoiceType,
    payment_method: undefined as number | undefined,
    date_issue: new Date().toISOString().split("T")[0],
    date_tax: "",
    date_due: "",
    variable_symbol: "",
    note: "",
    ico: "",
    modifier: undefined as number | undefined,
    dic: "",
    company_name: "",
    bank_account: "",
    street: "",
    city: "",
    postal_code: "",
    phone: "",
    email: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [amountPriceDialogOpen, setAmountPriceDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  const isType5 = formData.type === 5;

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleBlur = (field: string) => {
    // Validation logic here
  };

  const handleSelectContact = () => {
    // Open contact picker
  };

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setItemPickerOpen(false);
    setAmountPriceDialogOpen(true);
  };

  const handleConfirmAmountPrice = (amount: number, price: number) => {
    if (!selectedItem) return;

    const newItem: InvoiceItem = {
      ...selectedItem,
      amount,
      sale_price: price,
      total: amount * price,
    };

    setInvoiceItems((prev) => [...prev, newItem]);
    setSelectedItem(null);
    
    // Reopen item picker for next item
    setAmountPriceDialogOpen(false);
    setItemPickerOpen(true);
  };

  const handleCloseAmountPriceDialog = () => {
    setAmountPriceDialogOpen(false);
    setSelectedItem(null);
    // Reopen item picker
    setItemPickerOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid container item xs={12} spacing={3}>
          <Grid item xs={12} md={isType5 ? 12 : 4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <InvoiceHeader
                  type={formData.type}
                  number={formData.number}
                  paymentMethod={formData.payment_method}
                  dateIssue={formData.date_issue}
                  dateTax={formData.date_tax}
                  dateDue={formData.date_due}
                  variableSymbol={formData.variable_symbol}
                  errors={errors}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>

              {!isType5 && (
                <Grid item xs={12}>
                  <InvoiceContactInfo
                    type={formData.type}
                    ico={formData.ico}
                    modifier={formData.modifier}
                    dic={formData.dic}
                    companyName={formData.company_name}
                    street={formData.street}
                    city={formData.city}
                    postalCode={formData.postal_code}
                    phone={formData.phone}
                    email={formData.email}
                    bankAccount={formData.bank_account}
                    errors={errors}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onSelectContact={handleSelectContact}
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
                    onClick={() => setItemPickerOpen(true)}
                  >
                    <InventoryIcon sx={{ width: 24 }} />
                  </IconButton>
                </Tooltip>
              }
            >
              <InvoiceItemsList items={invoiceItems} />
            </FormSection>
          </Grid>
        </Grid>
      </Grid>

      <ItemPickerDialog
        open={itemPickerOpen}
        onClose={() => setItemPickerOpen(false)}
        onSelect={handleSelectItem}
      />

      <ItemAmountPriceDialog
        open={amountPriceDialogOpen}
        onClose={handleCloseAmountPriceDialog}
        onConfirm={handleConfirmAmountPrice}
        item={selectedItem}
        invoiceType={formData.type}
        contactPriceGroup={formData.modifier}
      />
    </Box>
  );
}

export default NewInvoiceTab;