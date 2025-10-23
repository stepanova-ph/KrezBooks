import { useState } from "react";
import type { Item } from "../types/database";
import type { InvoiceItem } from "./useInvoiceForm";

export function useInvoiceDialogs() {
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [amountPriceDialogOpen, setAmountPriceDialogOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemData, setEditingItemData] = useState<{
    amount: number;
    price: number;
    p_group_index: number;
  } | null>(null);

  const openItemPicker = () => {
    setItemPickerOpen(true);
  };

  const closeItemPicker = () => {
    setItemPickerOpen(false);
  };

  const openContactPicker = () => {
    setContactPickerOpen(true);
  };

  const closeContactPicker = () => {
    setContactPickerOpen(false);
  };

  const openAmountPriceDialog = (
    item: Item,
    editData?: { amount: number; price: number; p_group_index: number; index: number }
  ) => {
    setSelectedItem(item);
    if (editData) {
      setEditingItemIndex(editData.index);
      setEditingItemData({
        amount: editData.amount,
        price: editData.price,
        p_group_index: editData.p_group_index,
      });
    } else {
      setEditingItemIndex(null);
      setEditingItemData(null);
    }
    setAmountPriceDialogOpen(true);
  };

  const closeAmountPriceDialog = (shouldReopenItemPicker: boolean = false) => {
    setAmountPriceDialogOpen(false);
    setSelectedItem(null);
    setEditingItemIndex(null);
    setEditingItemData(null);
    
    if (shouldReopenItemPicker) {
      setItemPickerOpen(true);
    }
  };

  return {
    itemPicker: {
      open: itemPickerOpen,
      openDialog: openItemPicker,
      closeDialog: closeItemPicker,
    },
    contactPicker: {
      open: contactPickerOpen,
      openDialog: openContactPicker,
      closeDialog: closeContactPicker,
    },
    amountPrice: {
      open: amountPriceDialogOpen,
      selectedItem,
      editingItemIndex,
      editingItemData,
      openDialog: openAmountPriceDialog,
      closeDialog: closeAmountPriceDialog,
    },
  };
}