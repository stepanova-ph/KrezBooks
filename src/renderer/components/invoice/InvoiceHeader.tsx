import { Grid, MenuItem } from "@mui/material";
import { FormSection } from "../common/form/FormSection";
import ValidatedTextField from "../common/inputs/ValidatedTextField";
import { INVOICE_TYPES, PAYMENT_METHOD_TYPES } from "../../../config/constants";
import type { InvoiceType, PaymentMethodType } from "../../../types/database";

interface InvoiceHeaderProps {
  number: string;
  type: InvoiceType;
  paymentMethod: PaymentMethodType;
  dateIssue: string;
  dateTax: string;
  dateDue: string;
  variableSymbol: string;
  errors: Record<string, string>;
  onChange: (field: string, value: string | number) => void;
  onBlur: (field: string) => void;
}

export function InvoiceHeader({
  number,
  type,
  paymentMethod,
  dateIssue,
  dateTax,
  dateDue,
  variableSymbol,
  errors,
  onChange,
  onBlur,
}: InvoiceHeaderProps) {
  const requiresDateTax = type === 1 || type === 3;
  const requiresInvoiceFields = type === 2 || type === 4;

  return (
    <FormSection title="Hlavička">
      <Grid container spacing={2}>
        <Grid item md={3}>
          <ValidatedTextField
            label="Typ dokladu"
            name="type"
            value={type}
            onChange={(e) => onChange("type", Number(e.target.value))}
            onBlur={() => onBlur("type")}
            error={errors.type}
            select
            required
            fullWidth
          >
            {INVOICE_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </ValidatedTextField>
        </Grid>

        <Grid item md={3}>
          <ValidatedTextField
            label="Číslo dokladu"
            name="number"
            value={number}
            onChange={(e) => onChange("number", e.target.value)}
            onBlur={() => onBlur("number")}
            error={errors.number}
            required
            fullWidth
          />
        </Grid>

        <Grid item md={3}>
          <ValidatedTextField
            label="Způsob platby"
            name="payment_method"
            value={paymentMethod}
            onChange={(e) => onChange("payment_method", Number(e.target.value))}
            onBlur={() => onBlur("payment_method")}
            error={errors.payment_method}
            select
            required
            fullWidth
          >
            {PAYMENT_METHOD_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </ValidatedTextField>
        </Grid>

        <Grid item md={3}>
          <ValidatedTextField
            label="Datum vystavení"
            name="date_issue"
            type="date"
            value={dateIssue}
            onChange={(e) => onChange("date_issue", e.target.value)}
            onBlur={() => onBlur("date_issue")}
            error={errors.date_issue}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item md={3}>
          <ValidatedTextField
            label="Datum zdanitelného plnění"
            name="date_tax"
            type="date"
            value={dateTax}
            onChange={(e) => onChange("date_tax", e.target.value)}
            onBlur={() => onBlur("date_tax")}
            error={errors.date_tax}
            required={requiresDateTax}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item md={3}>
          <ValidatedTextField
            label="Datum splatnosti"
            name="date_due"
            type="date"
            value={dateDue}
            onChange={(e) => onChange("date_due", e.target.value)}
            onBlur={() => onBlur("date_due")}
            error={errors.date_due}
            required={requiresInvoiceFields}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item md={3}>
          <ValidatedTextField
            label="Variabilní symbol"
            name="variable_symbol"
            value={variableSymbol}
            onChange={(e) => onChange("variable_symbol", e.target.value)}
            onBlur={() => onBlur("variable_symbol")}
            error={errors.variable_symbol}
            required={requiresInvoiceFields}
            fullWidth
          />
        </Grid>
      </Grid>
    </FormSection>
  );
}