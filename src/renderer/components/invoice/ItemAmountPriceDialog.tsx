import React, { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  Button,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
  useTheme,
  Divider,
} from "@mui/material";
import { Item, InvoiceType } from "../../../types/database";
import { useKeyboardShortcuts } from "../../../hooks/keyboard/useKeyboardShortcuts";
import { NumberTextField } from "../common/inputs/NumberTextField";
import { VatPriceField } from "../common/inputs/VatPriceField";
import { WindowButton } from "../layout/WindowControls";
import { VAT_RATES } from "../../../config/constants";
import { FormSection } from "../common/form/FormSection";

interface ItemAmountPriceDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number, price: number) => void;
  item: Item | null;
  invoiceType: InvoiceType;
  contactPriceGroup?: number;
}

export function ItemAmountPriceDialog({
  open,
  onClose,
  onConfirm,
  item,
  invoiceType,
  contactPriceGroup,
}: ItemAmountPriceDialogProps) {
  const theme = useTheme();
  const [amount, setAmount] = useState<number>(1);
  const [selectedPrice, setSelectedPrice] = useState<"group1" | "group2" | "group3" | "group4" | "custom">("group1");
  const [customPrice, setCustomPrice] = useState<number>(0);

  const isType5 = invoiceType === 5;

  useEffect(() => {
    if (open && item) {
      setAmount(1);
      
      if (isType5) {
        setSelectedPrice("custom");
        setCustomPrice(0);
      } else {
        const defaultGroup = contactPriceGroup 
          ? (`group${contactPriceGroup}` as "group1" | "group2" | "group3" | "group4")
          : "group1";
        setSelectedPrice(defaultGroup);
        setCustomPrice(0);
      }
    }
  }, [open, item, isType5, contactPriceGroup]);

  // Get the final price to use
  const getFinalPrice = (): number => {
    if (!item) return 0;
    if (selectedPrice === "custom") return customPrice;
    
    switch (selectedPrice) {
      case "group1": return item.sale_price_group1;
      case "group2": return item.sale_price_group2;
      case "group3": return item.sale_price_group3;
      case "group4": return item.sale_price_group4;
      default: return 0;
    }
  };

  const handleConfirm = () => {
    const finalPrice = getFinalPrice();
    onConfirm(amount, finalPrice);
    onClose();
  };

  // ESC to close
  useKeyboardShortcuts(
    {
      Escape: onClose,
      Enter: handleConfirm,
    },
    {
      disabled: !open,
      preventInInputs: false,
    }
  );

  if (!item) return null;

  const vatPercentage = VAT_RATES[item.vat_rate as keyof typeof VAT_RATES]?.percentage ?? 21;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          width: "100%",
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pl: 2,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Typography variant="subtitle2" fontWeight={500}>
          Přidat položku - Množství a cena
        </Typography>
        <WindowButton type="close" onClick={onClose} />
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 , pb: 5}}>
        <FormSection>
          <Grid container spacing={2} alignItems="center">
            {/* Item info (66%) */}
            <Grid item xs={12} md={9.7}>
              <Typography variant="body2" color="text.secondary">
                {item.ean}
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {item.name}
              </Typography>
            </Grid>

            {/* Amount field (33%) */}
            <Grid item xs={12} md={2.3}>
              <NumberTextField
                label={`Množství (${item.unit_of_measure})`}
                name="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                precision={0}
                min={0}
                fullWidth
                autoFocus
              />
            </Grid>
          </Grid>
        </FormSection>
        <FormSection title="Cena" my={2} hideDivider>
        {/* Price selection - Type 5 (korekce skladu) */}
        {isType5 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Vlastní cena
            </Typography>
            <VatPriceField
              label="Vlastní"
              name="custom_price"
              value={customPrice}
              vatRate={vatPercentage}
              onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
              precision={2}
              min={0}
            />
          </Box>
        )}

        {/* Price selection - Other types */}
        {!isType5 && (
            <RadioGroup
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value as any)}
            >
              <Grid container spacing={2}>
                {/* Price Group 1 */}
                <Grid item xs={12}>
                  <FormControlLabel
                    value="group1"
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ width: "100%" }}>
                        <VatPriceField
                          label="Skupina 1"
                          name="price_group1"
                          value={item.sale_price_group1}
                          vatRate={vatPercentage}
                          onChange={() => {}}
                          precision={2}
                          min={0}
                        />
                      </Box>
                    }
                    sx={{ m: 0, alignItems: "flex-start" }}
                  />
                </Grid>

                {/* Price Group 2 */}
                <Grid item xs={12}>
                  <FormControlLabel
                    value="group2"
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ width: "100%" }}>
                        <VatPriceField
                          label="Skupina 2"
                          name="price_group2"
                          value={item.sale_price_group2}
                          vatRate={vatPercentage}
                          onChange={() => {}}
                          precision={2}
                          min={0}
                        />
                      </Box>
                    }
                    sx={{ m: 0, alignItems: "flex-start" }}
                  />
                </Grid>

                {/* Price Group 3 */}
                <Grid item xs={12}>
                  <FormControlLabel
                    value="group3"
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ width: "100%" }}>
                        <VatPriceField
                          label="Skupina 3"
                          name="price_group3"
                          value={item.sale_price_group3}
                          vatRate={vatPercentage}
                          onChange={() => {}}
                          precision={2}
                          min={0}
                        />
                      </Box>
                    }
                    sx={{ m: 0, alignItems: "flex-start" }}
                  />
                </Grid>

                {/* Price Group 4 */}
                <Grid item xs={12}>
                  <FormControlLabel
                    value="group4"
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ width: "100%" }}>
                        <VatPriceField
                          label="Skupina 4"
                          name="price_group4"
                          value={item.sale_price_group4}
                          vatRate={vatPercentage}
                          onChange={() => {}}
                          precision={2}
                          min={0}
                        />
                      </Box>
                    }
                    sx={{ m: 0, alignItems: "flex-start" }}
                  />
                </Grid>

                {/* Custom price */}
                <Grid item xs={12}>
                  <FormControlLabel
                    value="custom"
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ width: "100%" }}>
                        <VatPriceField
                          label="Vlastní"
                          name="custom_price"
                          value={customPrice}
                          vatRate={vatPercentage}
                          onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                          precision={2}
                          min={0}
                        />
                      </Box>
                    }
                    sx={{ m: 0, alignItems: "flex-start" }}
                  />
                </Grid>
              </Grid>
            </RadioGroup>
        )}
        </FormSection>
      </Box>
    </Dialog>
  );
}