import { Grid, MenuItem } from "@mui/material";
import { FormSection } from "../common/form/FormSection";
import ValidatedTextField from "../common/inputs/ValidatedTextField";
import {
	INVOICE_TYPES,
	PAYMENT_METHOD_TYPES,
} from "../../../config/constants";
import type {
	InvoiceType,
	PaymentMethodType,
} from "../../../types/database";

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
  disabled?: true;
}

function headerType5({
	number,
	dateIssue,
	errors,
  disabled,
	onChange,
	onBlur
}: Partial<InvoiceHeaderProps>) {
	return (
		<FormSection title="Hlavička" my={2}>
			<Grid container spacing={2}>
				<Grid item xs={4}>
					<ValidatedTextField
            select
						required
						fullWidth
						label="Typ dokladu"
						name="type"
						value={5}
            disabled={disabled}
						error={errors?.type}

						onChange={(e: { target: { value: string | number; }; }) => {
              if (onChange) {
                onChange("type", e.target.value);
              }
            }}

						onBlur={() => {
              if(onBlur) {
                onBlur("type")
              }
            }}
					>
						{INVOICE_TYPES.map((option) => (
							<MenuItem key={option.value} value={option.value}>
								{option.label}
							</MenuItem>
						))}
					</ValidatedTextField>
				</Grid>

				<Grid item xs={5}>
					<ValidatedTextField
            required
						fullWidth
						label="Číslo dokladu"
						name="number"
						value={number}
            error={errors?.number}
            disabled={disabled}

						onChange={(e: { target: { value: string | number; }; }) => {
              if (onChange) {
                onChange("number", e.target.value);
              }
            }}

						onBlur={() => {
              if(onBlur) {
                onBlur("number")
              }
            }}
					/>
				</Grid>

				<Grid item xs={3}>
					<ValidatedTextField
            required
						fullWidth
						label="Datum vystavení"
						name="date_issue"
						type="date"
						value={dateIssue}
            disabled={disabled}
            error={errors?.date_issue}
						InputLabelProps={{ shrink: true }}

						onChange={(e: { target: { value: string | number; }; }) => {
              if (onChange) {
                onChange("date_issue", e.target.value);
              }
            }}

						onBlur={() => {
              if(onBlur) {
                onBlur("date_issue")
              }
            }}
					/>
				</Grid>
			</Grid>
		</FormSection>
	);
}

export function InvoiceHeader({
  number,
  type, // 1: nákup hotovost, 2: nákup faktura, 3: prodej hotovost, 4: prodej faktura, 5: korekce
  paymentMethod,
  dateIssue,
  dateTax,
  dateDue,
  variableSymbol,
  errors,
  disabled,
  onChange,
  onBlur,
}: InvoiceHeaderProps) {
  const isType5 = type === 5;
  const showDateTax = type as number >= 1 && type as number <= 4;         // 1–4
  const showDateDue = type === 2 || type === 4;       // 2,4
  const requireInvoiceFields24 = type === 2 || type === 4; // for variable_symbol (+ your ICO/mod elsewhere)
  const showPaymentMethod = type === 2 || type === 4; // keep your original behavior

  if (isType5) {
      return headerType5({ number, dateIssue, errors, disabled, onChange, onBlur });
  }

  return (
    <FormSection title="Hlavička" my={2}>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <ValidatedTextField
            label="Typ dokladu"
            name="type"
            value={type}
            onChange={(e: { target: { value: any; }; }) => onChange("type", Number(e.target.value))}
            onBlur={() => onBlur("type")}
            error={errors.type}
            select
            required
            disabled={disabled}
            fullWidth
            sx={{
              ".MuiInputBase-input": {
                fontSize: showDateTax ? "0.78rem" : undefined,
              },
            }}
          >
            {INVOICE_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </ValidatedTextField>
        </Grid>

        <Grid item xs={6}>
          <ValidatedTextField
            label="Číslo dokladu"
            name="number"
            value={number}
            onChange={(e: { target: { value: string | number; }; }) => onChange("number", e.target.value)}
            onBlur={() => onBlur("number")}
            error={errors.number}
            required
            disabled={disabled}
            fullWidth
          />
        </Grid>

        <Grid item xs={showDateDue? 4 : 6}>
          <ValidatedTextField
            label="Datum vystavení"
            name="date_issue"
            type="date"
            value={dateIssue}
            onChange={(e: { target: { value: string | number; }; }) => onChange("date_issue", e.target.value)}
            onBlur={() => onBlur("date_issue")}
            error={errors.date_issue}
            required
            disabled={disabled}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{
              ".MuiInputBase-input": {
                fontSize: showDateDue ? "0.74rem" : undefined,
              },
            }}
          />
        </Grid>

        {showDateTax && (
          <Grid item xs={showDateDue? 4 : 6}>
            <ValidatedTextField
              label="Datum zdanitelného plnění"
              name="date_tax"
              type="date"
              value={dateTax}
              onChange={(e: { target: { value: string | number; }; }) => onChange("date_tax", e.target.value)}
              onBlur={() => onBlur("date_tax")}
              error={errors.date_tax}
              required
              disabled={disabled}
              fullWidth
              InputLabelProps={{ shrink: true }}
			  sx={{
              ".MuiInputBase-input": {
                fontSize: showDateDue ? "0.74rem" : undefined,
              },
            }}
            />
          </Grid>
        )}

        {showDateDue && (
          <Grid item xs={4}>
            <ValidatedTextField
              label="Datum splatnosti"
              name="date_due"
              type="date"
              value={dateDue}
              onChange={(e: { target: { value: string | number; }; }) => onChange("date_due", e.target.value)}
              onBlur={() => onBlur("date_due")}
              error={errors.date_due}
              required
            disabled={disabled}
              fullWidth
              InputLabelProps={{ shrink: true }}
			  sx={{
              ".MuiInputBase-input": {
                fontSize: showDateDue ? "0.74rem" : undefined,
              },
            }}
            />
          </Grid>
        )}

        {showPaymentMethod && (
          <Grid item xs={6}>
            <ValidatedTextField
              label="Způsob platby"
              name="payment_method"
              value={paymentMethod ?? ""}
              onChange={(e: { target: { value: any; }; }) => onChange("payment_method", Number(e.target.value))}
              onBlur={() => onBlur("payment_method")}
              error={errors.payment_method}
              select
            disabled={disabled}
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

        {/* Variabilní symbol – jen 2,4 (povinné) */}
        {requireInvoiceFields24 && (
          <Grid item xs={6}>
            <ValidatedTextField
              label="Variabilní symbol"
              name="variable_symbol"
              value={variableSymbol}
              onChange={(e: { target: { value: string | number; }; }) => onChange("variable_symbol", e.target.value)}
              onBlur={() => onBlur("variable_symbol")}
              error={errors.variable_symbol}
              required
              disabled={disabled}
              fullWidth
            />
          </Grid>
        )}
      </Grid>
    </FormSection>
  );
}
