import { Grid, IconButton, Tooltip, MenuItem } from "@mui/material";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import { FormSection } from "../common/form/FormSection";
import ValidatedTextField from "../common/inputs/ValidatedTextField";
import { DIC_PREFIXES } from "../../../config/contactFilterConfig";
import type { InvoiceType } from "../../../types/database";

interface InvoiceContactInfoProps {
  type: InvoiceType;
  ico: string;
  modifier: number | undefined;
  dic: string;
  companyName: string;
  street: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  bankAccount: string;
  dicPrefix: string | null;
  dicValue: string;
  errors: Record<string, string>;
  onChange: (field: string, value: string | number) => void;
  onDicChange: (field: "prefix" | "value", value: string | null) => void;
  onBlur: (field: string) => void;
  onSelectContact: () => void;
}

export function InvoiceContactInfo({
  type,
  ico,
  modifier,
  dic,
  companyName,
  street,
  city,
  postalCode,
  phone,
  email,
  bankAccount,
  dicPrefix,
  dicValue,
  errors,
  onChange,
  onDicChange,
  onBlur,
  onSelectContact,
}: InvoiceContactInfoProps) {
  const requiresContactInfo = type === 2 || type === 4;
  const isCustomDIC = dicPrefix === "vlastní";

  return (
    <FormSection
      title="Informace o obchodním partnerovi"
      actions={
        <Tooltip title="Vybrat z adresáře">
          <IconButton size="small" onClick={onSelectContact} color="primary">
            <PersonSearchIcon />
          </IconButton>
        </Tooltip>
      }
    >
      <Grid container spacing={2}>
        <Grid item md={2.5}>
          <ValidatedTextField
            label="IČO"
            name="ico"
            value={ico}
            onChange={(e) => onChange("ico", e.target.value)}
            onBlur={() => onBlur("ico")}
            error={errors.ico}
            required={requiresContactInfo}
            fullWidth
          />
        </Grid>

        <Grid item md={1.5}>
          <ValidatedTextField
            label="Mod"
            name="modifier"
            type="number"
            value={modifier ?? ""}
            onChange={(e) => onChange("modifier", e.target.value ? Number(e.target.value) : "")}
            onBlur={() => onBlur("modifier")}
            error={errors.modifier}
            required={requiresContactInfo}
            fullWidth
          />
        </Grid>

        <Grid item md={1.3}>
          <ValidatedTextField
            name="dic_prefix"
            value={dicPrefix ?? ""}
            onChange={(e) => onDicChange("prefix", e.target.value || null)}
            onBlur={() => onBlur("dic")}
            error={errors.dic}
            select
            fullWidth
          >
            <MenuItem value="">Bez DIČ</MenuItem>
            {DIC_PREFIXES.map((prefix) => (
              <MenuItem key={prefix.value} value={prefix.value}>
                {prefix.label}
              </MenuItem>
            ))}
          </ValidatedTextField>
        </Grid>

        <Grid item md={2.5}>
          <ValidatedTextField
            label={isCustomDIC ? "DIČ" : "Číselná část DIČ"}
            name="dic_value"
            value={dicValue}
            onChange={(e) => onDicChange("value", e.target.value)}
            onBlur={() => onBlur("dic")}
            error={errors.dic}
            disabled={!dicPrefix}
            placeholder={isCustomDIC ? "Zadejte celé DIČ" : "Zadejte číselnou část"}
            fullWidth
          />
        </Grid>

        <Grid item md={4}>
          <ValidatedTextField
            label="Název firmy"
            name="company_name"
            value={companyName}
            onChange={(e) => onChange("company_name", e.target.value)}
            onBlur={() => onBlur("company_name")}
            error={errors.company_name}
            fullWidth
          />
        </Grid>

        <Grid item md={6}>
          <ValidatedTextField
            label="Ulice a číslo popisné"
            name="street"
            value={street}
            onChange={(e) => onChange("street", e.target.value)}
            onBlur={() => onBlur("street")}
            error={errors.street}
            fullWidth
          />
        </Grid>

        <Grid item md={4}>
          <ValidatedTextField
            label="Město"
            name="city"
            value={city}
            onChange={(e) => onChange("city", e.target.value)}
            onBlur={() => onBlur("city")}
            error={errors.city}
            fullWidth
          />
        </Grid>

        <Grid item md={2}>
          <ValidatedTextField
            label="PSČ"
            name="postal_code"
            value={postalCode}
            onChange={(e) => onChange("postal_code", e.target.value)}
            onBlur={() => onBlur("postal_code")}
            error={errors.postal_code}
            fullWidth
          />
        </Grid>

        <Grid item md={4}>
          <ValidatedTextField
            label="Telefon"
            name="phone"
            value={phone}
            onChange={(e) => onChange("phone", e.target.value)}
            onBlur={() => onBlur("phone")}
            error={errors.phone}
            fullWidth
          />
        </Grid>

        <Grid item md={4}>
          <ValidatedTextField
            label="E-mail"
            name="email"
            type="email"
            value={email}
            onChange={(e) => onChange("email", e.target.value)}
            onBlur={() => onBlur("email")}
            error={errors.email}
            fullWidth
          />
        </Grid>

        <Grid item md={4}>
          <ValidatedTextField
            label="Číslo účtu"
            name="bank_account"
            value={bankAccount}
            onChange={(e) => onChange("bank_account", e.target.value)}
            onBlur={() => onBlur("bank_account")}
            error={errors.bank_account}
            fullWidth
          />
        </Grid>
      </Grid>
    </FormSection>
  );
}