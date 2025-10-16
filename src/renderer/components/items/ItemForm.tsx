import React, { useState } from "react";
import { Box, MenuItem } from "@mui/material";
import type { CreateItemInput, Item, VatRate } from "../../../types/database";
import { itemSchema, unitOptions } from "../../../validation/itemSchema";
import { FormDialog } from "../common/FormDialog";
import { FormTextField } from "../common/FormTextField";
import { NumberTextField } from "../common/NumberTextField";
import { VatPriceField } from "../common/VatPriceField";
import { FormSection } from "../common/FormSection";
import ValidatedTextField from "../common/ValidatedTextField";

interface ItemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateItemInput) => Promise<void>;
  initialData?: Partial<Item>;
  mode: "create" | "edit";
  isPending?: boolean;
}

// VAT configuration - maps VAT group indices to actual percentages
const VAT_RATES = {
  0: { percentage: 0, label: "0% (osvobozeno)" },
  1: { percentage: 12, label: "12% (snížená)" },
  2: { percentage: 21, label: "21% (základní)" },
} as const;

const defaultFormData: CreateItemInput = {
  name: "",
  sales_group: "1",
  note: "",
  vat_rate: 2 as VatRate,
  avg_purchase_price: 0,
  last_purchase_price: 0,
  unit_of_measure: "",
  sale_price_group1: 0,
  sale_price_group2: 0,
  sale_price_group3: 0,
  sale_price_group4: 0,
};

function ItemForm({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  isPending = false,
}: ItemFormProps) {
  const [formData, setFormData] = useState<CreateItemInput>(
    initialData ? { ...defaultFormData, ...initialData } : defaultFormData,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (
    e: React.ChangeEvent<{ name?: string; value: unknown }>,
  ) => {
    const name = e.target.name as string;

    // Clear error when user changes selection
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    setFormData((prev) => ({ ...prev, [name]: e.target.value as string }));
  };

  const handleBlur = (fieldName: string) => {
    // Validate single field on blur
    const result = itemSchema.safeParse(formData);
    if (!result.success) {
      const fieldError = result.error.issues.find(
        (err) => err.path[0] === fieldName,
      );
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [fieldName]: fieldError.message }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = itemSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (typeof err.path[0] === "string")
          fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await onSubmit({
        ...result.data,
        avg_purchase_price: Number(result.data.avg_purchase_price),
        last_purchase_price: Number(result.data.last_purchase_price),
        sale_price_group1: Number(result.data.sale_price_group1),
        sale_price_group2: Number(result.data.sale_price_group2),
        sale_price_group3: Number(result.data.sale_price_group3),
        sale_price_group4: Number(result.data.sale_price_group4),
      } as CreateItemInput);

      // Only reset if successful and in create mode
      if (mode === "create") {
        setFormData(defaultFormData);
      }
    } catch (error) {
      console.error("Chyba při ukládání položky:", error);
      alert(`Chyba při ukládání: ${(error as Error).message}`);
    }
  };

  const title = mode === "create" ? "Přidat novou položku" : "Upravit položku";
  const submitLabel = mode === "create" ? "Přidat položku" : "Uložit změny";

  // Get actual VAT percentage from the group index
  const vatPercentage =
    VAT_RATES[formData.vat_rate as keyof typeof VAT_RATES]?.percentage ?? 21;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={title}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={submitLabel}
    >
      <FormSection title="Základní informace">
        <ValidatedTextField
          label="Název položky"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={() => handleBlur("name")}
          error={errors.name}
          required
          fullWidth
          inputProps={{ autoComplete: "off" }}
        />
        <Box
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}
        >
          <FormTextField
            label="Prodejní skupina"
            name="sales_group"
            select
            value={formData.sales_group}
            onChange={handleSelectChange}
            error={!!errors.sales_group}
            SelectProps={{ native: true }}
            inputProps={{ autoComplete: "off" }}
          >
            <option value="1">Skupina 1</option>
            <option value="2">Skupina 2</option>
            <option value="3">Skupina 3</option>
            <option value="4">Skupina 4</option>
          </FormTextField>
          <FormTextField
            label="Měrná jednotka"
            name="unit_of_measure"
            select
            value={formData.unit_of_measure}
            onChange={handleSelectChange}
            onBlur={() => handleBlur("unit_of_measure")}
            error={!!errors.unit_of_measure}
            SelectProps={{ native: false }}
            inputProps={{ autoComplete: "off" }}
            required
          >
            <MenuItem value="">
              <em>Vyberte jednotku</em>
            </MenuItem>
            {unitOptions.map((u) => (
              <MenuItem key={u} value={u}>
                {u}
              </MenuItem>
            ))}
          </FormTextField>
          <FormTextField
            label="Sazba DPH"
            name="vat_rate"
            select
            value={formData.vat_rate}
            onChange={handleSelectChange}
            error={!!errors.vat_rate}
            SelectProps={{ native: false }}
            inputProps={{ autoComplete: "off" }}
            required
          >
            {Object.entries(VAT_RATES).map(([key, rate]) => (
              <MenuItem key={key} value={Number(key)}>
                {rate.label}
              </MenuItem>
            ))}
          </FormTextField>
        </Box>
        <ValidatedTextField
          label="Poznámka"
          name="note"
          value={formData.note}
          onChange={handleChange}
          onBlur={() => handleBlur("note")}
          error={errors.note}
          multiline
          rows={3}
          fullWidth
          inputProps={{ autoComplete: "off" }}
        />
      </FormSection>

      <FormSection title="Nákupní ceny">
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <NumberTextField
            disabled
            label="Průměrná nákupní cena"
            name="avg_purchase_price"
            value={formData.avg_purchase_price}
            onChange={handleChange}
            precision={2}
            min={0}
            grayWhenZero
          />
          <NumberTextField
            disabled
            label="Poslední nákupní cena"
            name="last_purchase_price"
            value={formData.last_purchase_price}
            onChange={handleChange}
            precision={2}
            min={0}
            grayWhenZero
          />
        </Box>
      </FormSection>

      <FormSection title="Prodejní ceny">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <VatPriceField
            label="Skupina 1"
            name="sale_price_group1"
            value={formData.sale_price_group1}
            vatRate={vatPercentage}
            onChange={handleChange}
            onBlur={() => handleBlur("sale_price_group1")}
            error={errors.sale_price_group1}
            precision={2}
            min={0}
            grayWhenZero
          />
          <VatPriceField
            label="Skupina 2"
            name="sale_price_group2"
            value={formData.sale_price_group2}
            vatRate={vatPercentage}
            onChange={handleChange}
            onBlur={() => handleBlur("sale_price_group2")}
            error={errors.sale_price_group2}
            precision={2}
            min={0}
            grayWhenZero
          />
          <VatPriceField
            label="Skupina 3"
            name="sale_price_group3"
            value={formData.sale_price_group3}
            vatRate={vatPercentage}
            onChange={handleChange}
            onBlur={() => handleBlur("sale_price_group3")}
            error={errors.sale_price_group3}
            precision={2}
            min={0}
            grayWhenZero
          />
          <VatPriceField
            label="Skupina 4"
            name="sale_price_group4"
            value={formData.sale_price_group4}
            vatRate={vatPercentage}
            onChange={handleChange}
            onBlur={() => handleBlur("sale_price_group4")}
            error={errors.sale_price_group4}
            precision={2}
            min={0}
            grayWhenZero
          />
        </Box>
      </FormSection>
    </FormDialog>
  );
}

export default ItemForm;
