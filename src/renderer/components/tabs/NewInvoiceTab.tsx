import React, { useState } from "react";
import { Box, Grid, IconButton, Tooltip } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import { InvoiceHeader } from "../invoice/InvoiceHeader";
import { InvoiceContactInfo } from "../invoice/InvoiceContactInfo";
import { InvoiceItemsList } from "../invoice/InvoiceItemsList";
import { FormSection } from "../common/form/FormSection";
import { ItemPickerDialog } from "../invoice/ItemPickerDialog";
import { ItemAmountPriceDialog } from "../invoice/ItemAmountPriceDialog";
import type { Contact, InvoiceType, Item } from "../../../types/database";
import { ContactPickerDialog } from "../invoice/ContactPickerDialog";

interface InvoiceItem extends Item {
  amount: number;
  sale_price: number;
  total: number;
  p_group_index: number;
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
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  const [dialogInitials, setDialogInitials] = useState({ amount: 0, price: 0, p_group_index: 0 });

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

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    console.log(`contact pricegroup: ${contact.price_group}`);
  };

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setEditingItemIndex(null);
    setItemPickerOpen(false);
    setDialogInitials({ amount: 0, price: 0, p_group_index: 0 });
    setAmountPriceDialogOpen(true);
  };

  const handleEditItem = (item: InvoiceItem) => {
    const index = invoiceItems.findIndex((i) => i.ean === item.ean);
    setEditingItemIndex(index);
    setSelectedItem(item);
    setDialogInitials({ amount: item.amount, price: item.sale_price, p_group_index: item.p_group_index });
    setAmountPriceDialogOpen(true);
  };

  const handleDeleteItem = (item: InvoiceItem) => {
    setInvoiceItems((prev) => prev.filter((i) => i.ean !== item.ean));
  };

  const handleConfirmAmountPrice = (amount: number, price: number, p_group_index: number) => {
    if (!selectedItem) return;

    const newItem: InvoiceItem = {
      ...selectedItem,
      amount,
      sale_price: price,
      total: amount * price,
      p_group_index
    };

    if (editingItemIndex !== null) {
      setInvoiceItems((prev) => {
        const updated = [...prev];
        updated[editingItemIndex] = newItem;
        return updated;
      });
    } else {
      setInvoiceItems((prev) => [...prev, newItem]);
      setItemPickerOpen(true);
    }

    setSelectedItem(null);
    setEditingItemIndex(null);
    setAmountPriceDialogOpen(false);
  };

  const handleCloseAmountPriceDialog = () => {
    setAmountPriceDialogOpen(false);
    setSelectedItem(null);
    setEditingItemIndex(null);
    
    if (editingItemIndex === null) {
      setItemPickerOpen(true);
    }
  };

  const getInitialAmount = () => {
    if (editingItemIndex !== null && selectedItem) {
      return (selectedItem as InvoiceItem).amount;
    }
    return undefined;
  };

  const getInitialPrice = () => {
    if (editingItemIndex !== null && selectedItem) {
      return (selectedItem as InvoiceItem).sale_price;
    }
    return undefined;
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
              <InvoiceItemsList 
                items={invoiceItems}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
              />
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
        contactPriceGroup={selectedContact?.price_group}
        initialAmount={getInitialAmount()}
        initialPrice={getInitialPrice()}
      />
    </Box>
  );
}

export default NewInvoiceTab;