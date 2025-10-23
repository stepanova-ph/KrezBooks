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
  Chip,
} from "@mui/material";
import { Item, InvoiceType } from "../../../../types/database";
import { useKeyboardShortcuts } from "../../../../hooks/keyboard/useKeyboardShortcuts";
import { NumberTextField } from "../../common/inputs/NumberTextField";
import { VatPriceField } from "../../common/inputs/VatPriceField";
import { WindowButton } from "../../layout/WindowControls";
import { VAT_RATES } from "../../../../config/constants";
import { useStockAmountByItem } from "../../../../hooks/useStockMovement";
import { FormSection } from "../../common/form/FormSection";

interface ItemAmountPriceDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number, price: number, p_group_index: number) => void;
  item: Item | null;
  invoiceType: InvoiceType;
  contactPriceGroup?: number;
  initialAmount?: number;
  initialPrice?: number;
  initialPriceGroup?: number;
}

type PriceGroup = "group1" | "group2" | "group3" | "group4" | "custom";

function getPriceGroupFromValue(item: Item, price: number): PriceGroup {
  if (Math.abs(price - item.sale_price_group1) < 0.01) return "group1";
  if (Math.abs(price - item.sale_price_group2) < 0.01) return "group2";
  if (Math.abs(price - item.sale_price_group3) < 0.01) return "group3";
  if (Math.abs(price - item.sale_price_group4) < 0.01) return "group4";
  return "custom";
}

function getPriceGroupIndex(priceGroup: PriceGroup): number {
  switch (priceGroup) {
    case "group1": return 1;
    case "group2": return 2;
    case "group3": return 3;
    case "group4": return 4;
    default: return 0;
  }
}

function getDefaultPriceGroup(contactPriceGroup?: number): PriceGroup {
  if (!contactPriceGroup) return "group1";
  return `group${contactPriceGroup}` as PriceGroup;
}

export function ItemAmountPriceDialog({
  open,
  onClose,
  onConfirm,
  item,
  invoiceType,
  contactPriceGroup,
  initialAmount,
  initialPrice,
  initialPriceGroup,
}: ItemAmountPriceDialogProps) {
  const theme = useTheme();
  const [amount, setAmount] = useState<number>(1);
  const [selectedPrice, setSelectedPrice] = useState<PriceGroup>("group1");
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [amountError, setAmountError] = useState<string>("");

  const { data: stockAmount = 0 } = useStockAmountByItem(item?.ean || "");

  const isType5 = invoiceType === 5;
  const isSale = invoiceType === 3 || invoiceType === 4;
  const isEditing = initialAmount !== undefined && initialPrice !== undefined;

  useEffect(() => {
    if (open && item) {
      setAmountError("");

      setAmount(initialAmount ?? 1);

      if (isType5) {
        setSelectedPrice("custom");
        setCustomPrice(initialPrice ?? 0);
      } else {
        if (initialPrice !== undefined) {
          const priceGroup = getPriceGroupFromValue(item, initialPrice);
          setSelectedPrice(priceGroup);
          if (priceGroup === "custom") {
            setCustomPrice(initialPrice);
          }
        } else {
          const defaultGroup = getDefaultPriceGroup(contactPriceGroup);
          setSelectedPrice(defaultGroup);
          setCustomPrice(0);
        }
      }
    }
  }, [open, item, isType5, contactPriceGroup, initialAmount, initialPrice]);

  const getFinalPrice = (): number => {
    if (!item) return 0;
    if (selectedPrice === "custom") return customPrice;

    switch (selectedPrice) {
      case "group1":
        return item.sale_price_group1;
      case "group2":
        return item.sale_price_group2;
      case "group3":
        return item.sale_price_group3;
      case "group4":
        return item.sale_price_group4;
      default:
        return 0;
    }
  };

  const getProjectedStock = (): number => {
    if (isSale) {
      return stockAmount - amount;
    } else {
      return stockAmount + amount;
    }
  };

  const projectedStock = getProjectedStock();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseFloat(e.target.value) || 0;
    setAmount(newAmount);

    if (isSale && newAmount > stockAmount) {
      setAmountError("Nedostatečné množství na skladě");
    } else {
      setAmountError("");
    }
  };

  const handleConfirm = () => {
    if (isSale && amount > stockAmount) {
      setAmountError("Nedostatečné množství na skladě");
      return;
    }

    const finalPrice = getFinalPrice();
    const p_group_index = getPriceGroupIndex(selectedPrice);
    onConfirm(amount, finalPrice, p_group_index);
  };

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

  const vatPercentage =
    VAT_RATES[item.vat_rate as keyof typeof VAT_RATES]?.percentage ?? 21;

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
          zIndex: 1400,
        },
      }}
    >
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
          {isEditing
            ? "Upravit položku - Množství a cena"
            : "Přidat položku - Množství a cena"}
        </Typography>
        <WindowButton type="close" onClick={onClose} />
      </Box>

      <Box sx={{ p: 3 }}>
        <FormSection>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={9.7}>
              <Typography variant="body2" color="text.secondary">
                {item.ean}
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {item.name}
              </Typography>
            </Grid>

            <Grid item xs={12} md={2.3}>
              <NumberTextField
                label={`Množství (${item.unit_of_measure})`}
                name="amount"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                error={amountError}
                precision={2}
                min={isType5 ? undefined : 0}
                fullWidth
                autoFocus
              />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Cena" my={2} hideDivider>
          {isType5 && (
            <VatPriceField
              label="Vlastní"
              name="custom_price"
              value={customPrice}
              vatRate={vatPercentage}
              onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
              precision={2}
              min={0}
            />
          )}

          {!isType5 && (
            <RadioGroup
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value as PriceGroup)}
            >
              <Grid container spacing={2}>
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
                          onChange={(e) =>
                            setCustomPrice(parseFloat(e.target.value) || 0)
                          }
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

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            p: 2,
            mt: 3,
            bgcolor: "background.default",
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Aktuální stav:
          </Typography>
          <Chip
            label={`${stockAmount.toFixed(2)} ${item.unit_of_measure}`}
            color={
              stockAmount > 0 ? "success" : stockAmount < 0 ? "error" : "default"
            }
            size="small"
            sx={{ fontWeight: 600 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
            →
          </Typography>
          <Chip
            label={`${projectedStock.toFixed(2)} ${item.unit_of_measure}`}
            color={
              projectedStock > 0
                ? "success"
                : projectedStock < 0
                ? "error"
                : "default"
            }
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            pt: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
            mt: 3,
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            fullWidth
            sx={{
              textTransform: "none",
              borderRadius: 0,
            }}
          >
            Zrušit
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            fullWidth
            disabled={!!amountError}
            sx={{
              textTransform: "none",
              borderRadius: 0,
            }}
          >
            {isEditing ? "Uložit změny" : "Přidat položku"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}