import React, { useState } from "react";
import { Grid, MenuItem } from "@mui/material";
import type { CreateItemInput, Item, VatRate } from "../../../types/database";
import { itemSchema } from "../../../validation/itemSchema";
import { FormDialog } from "../common/FormDialog";
import { FormTextField } from "../common/FormTextField";
import { NumberTextField } from "../common/NumberTextField";
import { VatPriceField } from "../common/VatPriceField";
import { FormSection } from "../common/FormSection";
import ValidatedTextField from "../common/ValidatedTextField";
import { useItems } from "../../../hooks/useItems";
import { ValidatedAutocomplete } from "../common/ValidatedAutocomplete";
import { VAT_RATES, UNIT_OPTIONS } from "../../../config/constants";

interface ItemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateItemInput) => Promise<void>;
  initialData?: Partial<Item>;
  mode: "create" | "edit";
  isPending?: boolean;
}


const defaultFormData: CreateItemInput = {
  ean: "",
  name: "",
  category: "",
  note: "",
  vat_rate: 2 as VatRate,
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

  const { data: allItems } = useItems();

  const existingCategories = React.useMemo(() => {
    if (!allItems) return [];
    const categories = allItems
      .map((item) => item.category)
      .filter((cat): cat is string => !!cat && cat.trim() !== "");
    return Array.from(new Set(categories)).sort();
  }, [allItems]);

  const existingUnits = React.useMemo(() => {
    if (!allItems) return UNIT_OPTIONS;
    const units = allItems
      .map((item) => item.unit_of_measure)
      .filter((u): u is string => !!u && u.trim() !== "");
    return Array.from(new Set([...UNIT_OPTIONS, ...units])).sort();
  }, [allItems]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSelectChange = (
    e: React.ChangeEvent<{ name?: string; value: unknown }>,
  ) => {
    const name = e.target.name as string;
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    setFormData((p) => ({ ...p, [name]: e.target.value as string }));
  };

  const handleBlur = (fieldName: string) => {
    const result = itemSchema.safeParse(formData);
    if (!result.success) {
      const fieldError = result.error.issues.find((err) => err.path[0] === fieldName);
      if (fieldError) setErrors((p) => ({ ...p, [fieldName]: fieldError.message }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = itemSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (typeof err.path[0] === "string") fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await onSubmit({
        ...result.data,
        sale_price_group1: Number(result.data.sale_price_group1),
        sale_price_group2: Number(result.data.sale_price_group2),
        sale_price_group3: Number(result.data.sale_price_group3),
        sale_price_group4: Number(result.data.sale_price_group4),
      } as CreateItemInput);

      if (mode === "create") setFormData(defaultFormData);
    } catch (error) {
      console.error("Chyba při ukládání položky:", error);
      alert(`Chyba při ukládání: ${(error as Error).message}`);
    }
  };

  const title = mode === "create" ? "Přidat novou položku" : "Upravit položku";
  const submitLabel = mode === "create" ? "Přidat položku" : "Uložit změny";

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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3.5}>
            <ValidatedTextField
              size="small"
              label="EAN"
              name="ean"
              value={formData.ean}
              onChange={handleChange}
              onBlur={() => handleBlur("ean")}
              error={errors.ean}
              required
              fullWidth
              disabled={mode === "edit"}
              inputProps={{ autoComplete: "off" }}
            />
          </Grid>
          <Grid item xs={12} md={8.5}>
            <ValidatedTextField
              size="small"
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
          </Grid>

          <Grid item xs={12} md={4.95}>
            <ValidatedAutocomplete
              size="small"
              freeSolo
              options={existingCategories}
              value={formData.category || ""}
              onChange={(_, newValue) => {
                setFormData((p) => ({ ...p, category: newValue || "" }));
                if (errors.category) setErrors((p) => ({ ...p, category: "" }));
              }}
              onInputChange={(_, newInputValue) => {
                setFormData((p) => ({ ...p, category: newInputValue }));
                if (errors.category) setErrors((p) => ({ ...p, category: "" }));
              }}
              label="Kategorie"
              name="category"
              error={errors.category}
              onBlur={() => handleBlur("category")}
            />
          </Grid>

          <Grid item xs={12} md={3.25}>
            <ValidatedAutocomplete
              size="small"
              freeSolo
              options={existingUnits}
              value={formData.unit_of_measure || ""}
              onChange={(_, newValue) => {
                setFormData((p) => ({ ...p, unit_of_measure: newValue || "" }));
                if (errors.unit_of_measure)
                  setErrors((p) => ({ ...p, unit_of_measure: "" }));
              }}
              onInputChange={(_, newInputValue) => {
                setFormData((p) => ({ ...p, unit_of_measure: newInputValue }));
                if (errors.unit_of_measure)
                  setErrors((p) => ({ ...p, unit_of_measure: "" }));
              }}
              label="Měrná jednotka"
              name="unit_of_measure"
              error={errors.unit_of_measure}
              onBlur={() => handleBlur("unit_of_measure")}
              required
            />
          </Grid>

          <Grid item xs={12} md={3.8}>
            <FormTextField
              size="small"
              label="Sazba DPH"
              name="vat_rate"
              select
              value={formData.vat_rate}
              onChange={handleSelectChange}
              error={!!errors.vat_rate}
              SelectProps={{ native: false }}
              inputProps={{ autoComplete: "off" }}
              required
              fullWidth
            >
              {Object.entries(VAT_RATES).map(([key, rate]) => (
                <MenuItem key={key} value={Number(key)}>
                  {rate.label}
                </MenuItem>
              ))}
            </FormTextField>
          </Grid>

          <Grid item xs={12}>
            <ValidatedTextField
              size="small"
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
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title="Nákupní ceny">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <NumberTextField
              size="small"
              disabled
              label="Průměrná nákupní cena"
              name="avg_purchase_price"
              // value={formData.avg_purchase_price}
              value={0.0}
              onChange={handleChange}
              precision={2}
              min={0}
              grayWhenZero
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <NumberTextField
              size="small"
              disabled
              label="Poslední nákupní cena"
              name="last_purchase_price"
              // value={formData.last_purchase_price}
              value={0.0}
              onChange={handleChange}
              precision={2}
              min={0}
              grayWhenZero
              fullWidth
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title="Prodejní ceny">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <VatPriceField
              size="small"
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
          </Grid>
          <Grid item xs={12} md={6}>
            <VatPriceField
              size="small"
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
          </Grid>
          <Grid item xs={12} md={6}>
            <VatPriceField
              size="small"
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
          </Grid>
          <Grid item xs={12} md={6}>
            <VatPriceField
              size="small"
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
          </Grid>
        </Grid>
      </FormSection>
    </FormDialog>
  );
}

export default ItemForm;
