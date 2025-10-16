import {
  FormControlLabel,
  Checkbox,
  Box,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
} from "@mui/material";
import { useEffect, useState } from "react";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import type { CreateContactInput, Contact } from "../../../types/database";
import { contactSchema } from "../../../validation/contactSchema";
import { FormDialog } from "../common/FormDialog";
import { FormTextField } from "../common/FormTextField";
import { FormSection } from "../common/FormSection";
import {
  splitBankAccount,
  combineBankAccount,
  splitDIC,
  combineDIC,
} from "../../../utils/formUtils";
import { DIC_PREFIXES } from "../../../config/contactFilterConfig";
import TextFieldWithError from "../common/TextFieldWithError";

interface ContactFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContactInput) => Promise<void>;
  initialData?: Partial<Contact>;
  mode: "create" | "edit";
  isPending?: boolean;
}

const defaultFormData: CreateContactInput = {
  ico: "",
  dic: "",
  modifier: 0,
  company_name: "",
  representative_name: "",
  street: "",
  city: "",
  postal_code: "",
  phone: "",
  email: "",
  website: "",
  bank_account: "",
  is_supplier: false,
  is_customer: true,
  price_group: 1,
};

function ContactForm({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  isPending = false,
}: ContactFormProps) {
  const initialBankAccount = splitBankAccount(initialData?.bank_account);
  const initialDIC = splitDIC(initialData?.dic);

  const [formData, setFormData] = useState<CreateContactInput>(
    initialData
      ? {
          ...defaultFormData,
          ...initialData,
          is_customer:
            typeof initialData.is_customer === "boolean"
              ? initialData.is_customer
              : !!initialData.is_customer,
          is_supplier:
            typeof initialData.is_supplier === "boolean"
              ? initialData.is_supplier
              : !!initialData.is_supplier,
        }
      : defaultFormData,
  );

  const [bankAccountParts, setBankAccountParts] = useState(initialBankAccount);
  const [dicParts, setDicParts] = useState(initialDIC);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // Reset form when dialog opens
    if (open) {
      if (initialData) {
        // Edit mode - populate with initial data
        setFormData({
          ...defaultFormData,
          ...initialData,
          is_customer:
            typeof initialData.is_customer === "boolean"
              ? initialData.is_customer
              : !!initialData.is_customer,
          is_supplier:
            typeof initialData.is_supplier === "boolean"
              ? initialData.is_supplier
              : !!initialData.is_supplier,
        });
        setBankAccountParts(splitBankAccount(initialData.bank_account));
        setDicParts(splitDIC(initialData.dic));
      } else {
        // Create mode - reset to defaults
        setFormData(defaultFormData);
        setBankAccountParts({ accountNumber: "", bankCode: "" });
        setDicParts({ prefix: null, value: "" });
      }
      // Always clear errors when dialog opens
      setErrors({});
      setIsUnlocked(false);
    }
  }, [open, initialData]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? Boolean(checked) : value,
    }));
  };

  const handleBlur = (fieldName: string) => {
    // Validate single field on blur
    const dataToValidate = {
      ...formData,
      bank_account: combineBankAccount(
        bankAccountParts.accountNumber,
        bankAccountParts.bankCode,
      ),
      dic: combineDIC(dicParts.prefix, dicParts.value),
    };

    const result = contactSchema.safeParse(dataToValidate);
    if (!result.success) {
      const fieldError = result.error.issues.find(
        (err) => err.path[0] === fieldName,
      );
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [fieldName]: fieldError.message }));
      }
    }
  };

  const handleBankAccountChange =
    (field: "accountNumber" | "bankCode") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // Clear error when typing
      if (errors.bank_account) {
        setErrors((prev) => ({ ...prev, bank_account: "" }));
      }

      setBankAccountParts((prev) => {
        const updated = { ...prev, [field]: newValue };
        setFormData((prevForm) => ({
          ...prevForm,
          bank_account: combineBankAccount(
            updated.accountNumber,
            updated.bankCode,
          ),
        }));
        return updated;
      });
    };

  const handleDICChange =
    (field: "prefix" | "value") =>
    (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
      const newValue =
        field === "prefix"
          ? (e.target.value as string)
          : (e.target as HTMLInputElement).value;

      // Clear error when typing
      if (errors.dic) {
        setErrors((prev) => ({ ...prev, dic: "" }));
      }

      setDicParts((prev) => {
        const updated = {
          ...prev,
          [field]: field === "prefix" ? newValue || null : newValue,
        };

        // Reset value if switching to/from custom
        if (field === "prefix") {
          updated.value = newValue ? prev.value : "";
        }

        setFormData((prevForm) => ({
          ...prevForm,
          dic: combineDIC(updated.prefix, updated.value),
        }));
        return updated;
      });
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const dataToValidate = {
      ...formData,
      bank_account: combineBankAccount(
        bankAccountParts.accountNumber,
        bankAccountParts.bankCode,
      ),
      dic: combineDIC(dicParts.prefix, dicParts.value),
    };

    const result = contactSchema.safeParse(dataToValidate);
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
      await onSubmit(result.data as CreateContactInput);
      // Only reset and close if onSubmit succeeds
      if (mode === "create") {
        setFormData(defaultFormData);
        setBankAccountParts({ accountNumber: "", bankCode: "" });
        setDicParts({ prefix: null, value: "" });
      }
      // Don't call onClose here - let the parent component handle it
    } catch (error) {
      console.error("Chyba při ukládání kontaktu:", error);
      // Show error to user
      alert(`Chyba při ukládání: ${(error as Error).message}`);
    }
  };

  const title = mode === "create" ? "Přidat nový kontakt" : "Upravit kontakt";
  const submitLabel = mode === "create" ? "Přidat kontakt" : "Uložit změny";

  const isCustomDIC = dicParts.prefix === "vlastní";

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={title}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={submitLabel}
    >
      <FormSection title="Základní údaje">
        {/* ICO and Modifier on same row */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 2 }}>
          <TextFieldWithError
            label="IČO"
            name="ico"
            value={formData.ico}
            onChange={handleChange}
            onBlur={() => handleBlur("ico")}
            error={errors.ico}
            grayWhenEmpty
            required
            disabled={mode === "edit" && !isUnlocked}
            fullWidth
          />
          <TextFieldWithError
            label="Modifikátor"
            name="modifier"
            type="number"
            value={formData.modifier}
            onChange={handleChange}
            onBlur={() => handleBlur("modifier")}
            error={errors.modifier}
            grayWhenZero
            inputProps={{ step: "1" }}
            fullWidth
          />
        </Box>

        {/* DIC with country code selector */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
          {!isCustomDIC ? (
            <>
              <FormControl
                size="small"
                sx={{ minWidth: 80 }}
                error={!!errors.dic}
              >
                <InputLabel>DIČ</InputLabel>
                <Select
                  value={dicParts.prefix || ""}
                  label="DIČ"
                  onChange={(e) => handleDICChange("prefix")(e as any)}
                  disabled={mode === "edit" && !isUnlocked}
                >
                  <MenuItem value="">
                    <em>Vybrat...</em>
                  </MenuItem>
                  {DIC_PREFIXES.map((prefix) => (
                    <MenuItem key={prefix} value={prefix}>
                      {prefix}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextFieldWithError
                placeholder="Zadejte DIČ bez předpony..."
                value={dicParts.value}
                disabled={!dicParts.prefix || (mode === "edit" && !isUnlocked)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleDICChange("value")(e)
                }
                onBlur={() => handleBlur("dic")}
                error={errors.dic}
                sx={{ flex: 1 }}
                fullWidth
              />
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 0.5,
                flex: 1,
              }}
            >
              <TextFieldWithError
                label="DIČ"
                placeholder="Vlastní formát DIČ..."
                value={dicParts.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleDICChange("value")(e)
                }
                onBlur={() => handleBlur("dic")}
                error={errors.dic}
                disabled={mode === "edit" && !isUnlocked}
                sx={{ flex: 1 }}
                fullWidth
              />
              <IconButton
                size="small"
                onClick={() => setDicParts({ prefix: null, value: "" })}
                title="Zrušit vlastní DIČ"
                disabled={mode === "edit" && !isUnlocked}
                sx={{ mt: "8px" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        {mode === "edit" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: -1 }}>
            <Tooltip
              title={
                isUnlocked
                  ? "Zamknout IČO a DIČ"
                  : "Odemknout IČO a DIČ pro úpravu"
              }
            >
              <IconButton
                size="small"
                onClick={() => setIsUnlocked(!isUnlocked)}
                color={isUnlocked ? "error" : "default"}
              >
                {isUnlocked ? (
                  <LockOpenIcon fontSize="small" />
                ) : (
                  <LockIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Box
              component="span"
              sx={{ fontSize: "0.875rem", color: "text.secondary" }}
            >
              {isUnlocked
                ? "IČO a DIČ jsou odemčeny"
                : "Klikněte pro odemčení IČO a DIČ"}
            </Box>
          </Box>
        )}

        <TextFieldWithError
          label="Název firmy"
          name="company_name"
          value={formData.company_name}
          onChange={handleChange}
          onBlur={() => handleBlur("company_name")}
          error={errors.company_name}
          grayWhenEmpty
          required
          fullWidth
        />

        {/* Contact Type */}
        <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_customer}
                onChange={handleChange}
                name="is_customer"
                color="primary"
              />
            }
            label="Odběratel"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_supplier}
                onChange={handleChange}
                name="is_supplier"
                color="secondary"
              />
            }
            label="Dodavatel"
          />
          {(errors.is_customer || errors.is_supplier) && (
            <Tooltip
              title={errors.is_customer || errors.is_supplier || ""}
              arrow
            >
              <ErrorOutlineIcon
                sx={{
                  color: "error.main",
                  fontSize: 20,
                  cursor: "help",
                  ml: 1,
                }}
              />
            </Tooltip>
          )}
        </Box>
      </FormSection>

      <FormSection title="Adresa">
        <TextFieldWithError
          label="Ulice a číslo popisné"
          name="street"
          value={formData.street ?? ""}
          onChange={handleChange}
          onBlur={() => handleBlur("street")}
          error={errors.street}
          grayWhenEmpty
          fullWidth
        />
        <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 2 }}>
          <TextFieldWithError
            label="Město"
            name="city"
            value={formData.city ?? ""}
            onChange={handleChange}
            onBlur={() => handleBlur("city")}
            error={errors.city}
            grayWhenEmpty
          />
          <TextFieldWithError
            label="PSČ"
            name="postal_code"
            value={formData.postal_code ?? ""}
            onChange={handleChange}
            onBlur={() => handleBlur("postal_code")}
            error={errors.postal_code}
            grayWhenEmpty
          />
        </Box>
      </FormSection>

      <FormSection title="Kontaktní údaje">
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <TextFieldWithError
            label="Telefon"
            name="phone"
            value={formData.phone ?? ""}
            onChange={handleChange}
            onBlur={() => handleBlur("phone")}
            error={errors.phone}
          />
          <TextFieldWithError
            label="E-mail"
            name="email"
            type="email"
            value={formData.email ?? ""}
            onChange={handleChange}
            onBlur={() => handleBlur("email")}
            error={errors.email}
          />
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <TextFieldWithError
            label="Kontaktní osoba"
            name="representative_name"
            value={formData.representative_name ?? ""}
            onChange={handleChange}
            onBlur={() => handleBlur("representative_name")}
            error={errors.representative_name}
            fullWidth
          />
          <TextFieldWithError
            label="Webové stránky"
            name="website"
            value={formData.website ?? ""}
            onChange={handleChange}
            onBlur={() => handleBlur("website")}
            error={errors.website}
            fullWidth
          />
        </Box>
      </FormSection>

      <FormSection title="Finanční údaje">
        <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 2 }}>
          <TextFieldWithError
            label="Číslo účtu"
            type="number"
            name="accountNumber"
            value={bankAccountParts.accountNumber}
            onChange={handleBankAccountChange("accountNumber")}
            onBlur={() => handleBlur("bank_account")}
            error={errors.bank_account}
            placeholder="123456789"
            fullWidth
          />
          <TextFieldWithError
            type="number"
            label="Kód banky"
            name="bankCode"
            value={bankAccountParts.bankCode}
            onChange={handleBankAccountChange("bankCode")}
            onBlur={() => handleBlur("bank_account")}
            error={errors.bank_account}
            placeholder="0100"
            fullWidth
            showToolTip={false}
          />
        </Box>

        <FormControl size="small" fullWidth>
          <InputLabel>Cenová skupina</InputLabel>
          <Select
            value={formData.price_group}
            label="Cenová skupina"
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                price_group: Number(e.target.value),
              }));
            }}
          >
            <MenuItem value={1}>Skupina 1</MenuItem>
            <MenuItem value={2}>Skupina 2</MenuItem>
            <MenuItem value={3}>Skupina 3</MenuItem>
            <MenuItem value={4}>Skupina 4</MenuItem>
          </Select>
        </FormControl>
      </FormSection>
    </FormDialog>
  );
}

export default ContactForm;
