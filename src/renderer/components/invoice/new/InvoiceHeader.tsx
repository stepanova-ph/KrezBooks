import { Grid, MenuItem } from "@mui/material";
import { FormSection } from "../../common/form/FormSection";
import ValidatedTextField from "../../common/inputs/ValidatedTextField";
import { INVOICE_TYPES, PAYMENT_METHOD_TYPES } from "../../../../config/constants";
import type { InvoiceType, PaymentMethodType } from "../../../../types/database";

interface InvoiceHeaderProps {
  number: string;
  type: InvoiceType;
  paymentMethod?: PaymentMethodType;
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
  const isType5 = type === 5;

  return (
    <FormSection title="Hlavička" my={2}>
      <Grid container spacing={2}>
        <Grid item xs={isType5 ? 4 : requiresDateTax ? 5 : 5.5}>
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
            sx={{
              '.MuiInputBase-input': { fontSize: requiresDateTax? '0.78rem' : undefined },
            }}
          >
            {INVOICE_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </ValidatedTextField>
        </Grid>

        <Grid item xs={isType5 ? 5 : requiresDateTax ? 3.5 : 6.5}>
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

        <Grid item xs={isType5 ? 3 : requiresDateTax ? 3.5 : 4}>
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
            sx={{
              '.MuiInputBase-input': { fontSize: requiresDateTax? '0.74rem' : undefined },
            }}
          />
        </Grid>

        {!isType5 && (
          <>
            {requiresDateTax || requiresInvoiceFields && (
              <Grid item xs={requiresInvoiceFields ? 4 : 3}>
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
            )}

            {requiresInvoiceFields && (
              <Grid item xs={4}>
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
            )}

            {requiresInvoiceFields && (
              <Grid item xs={requiresInvoiceFields ? 6 : 4}>
              <ValidatedTextField
                label="Způsob platby"
                name="payment_method"
                value={paymentMethod ?? ""}
                onChange={(e) => onChange("payment_method", Number(e.target.value))}
                onBlur={() => onBlur("payment_method")}
                error={errors.payment_method}
                select
                fullWidth
              >
                <MenuItem value="">
                  <em>Žádný</em>
                </MenuItem>
                {PAYMENT_METHOD_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </ValidatedTextField>
            </Grid>
            )}

            {requiresInvoiceFields && (
              <Grid item xs={6}>
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
            )}
          </>
        )}
      </Grid>
    </FormSection>
  );
}