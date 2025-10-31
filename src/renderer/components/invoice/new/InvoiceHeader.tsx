import { Grid, MenuItem } from "@mui/material";
import { FormSection } from "../../common/form/FormSection";
import ValidatedTextField from "../../common/inputs/ValidatedTextField";
import {
	INVOICE_TYPES,
	PAYMENT_METHOD_TYPES,
} from "../../../../config/constants";
import type {
	InvoiceType,
	PaymentMethodType,
} from "../../../../types/database";

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

function headerType5({
	number,
	dateIssue,
	errors,
	onChange,
	onBlur
}: Partial<InvoiceHeaderProps>) {
	return (
		<FormSection title="Hlavička" my={2}>
			<Grid container spacing={2}>
				<Grid item xs={4}>
					<ValidatedTextField
						label="Typ dokladu"
						name="type"
						value={5}
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

				<Grid item xs={5}>
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

				<Grid item xs={3}>
					<ValidatedTextField
						label="Datum vystavení"
						name="date_issue"
						type="date"
						value={dateIssue}
						onChange={(e) => onChange("date_issue", e.target.value)}
						onBlur={() => onBlur("date_issue")}
						error={errors?.date_issue}
						required
						fullWidth
						InputLabelProps={{ shrink: true }}
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
  onChange,
  onBlur,
}: InvoiceHeaderProps) {
  // visibility / requirement rules
  const isType5 = type === 5;
  const showDateTax = type >= 1 && type <= 4;         // 1–4
  const showDateDue = type === 2 || type === 4;       // 2,4
  const requireInvoiceFields24 = type === 2 || type === 4; // for variable_symbol (+ your ICO/mod elsewhere)
  const showPaymentMethod = type === 2 || type === 4; // keep your original behavior

  if (isType5) {
    return headerType5({ number, errors, onChange, onBlur });
  }

  return (
    <FormSection title="Hlavička" my={2}>
      <Grid container spacing={2}>
        {/* Typ dokladu */}
        <Grid item xs={6}>
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

        {/* Číslo dokladu */}
        <Grid item xs={6}>
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

        {/* Datum vystavení */}
        <Grid item xs={4}>
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
              ".MuiInputBase-input": {
                fontSize: showDateDue ? "0.74rem" : undefined,
              },
            }}
          />
        </Grid>

        {/* Datum zdanitelného plnění – 1–4 (povinné) */}
        {showDateTax && (
          <Grid item xs={4}>
            <ValidatedTextField
              label="Datum zdanitelného plnění"
              name="date_tax"
              type="date"
              value={dateTax}
              onChange={(e) => onChange("date_tax", e.target.value)}
              onBlur={() => onBlur("date_tax")}
              error={errors.date_tax}
              required
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

        {/* Datum splatnosti – jen 2,4 (povinné) */}
        {showDateDue && (
          <Grid item xs={4}>
            <ValidatedTextField
              label="Datum splatnosti"
              name="date_due"
              type="date"
              value={dateDue}
              onChange={(e) => onChange("date_due", e.target.value)}
              onBlur={() => onBlur("date_due")}
              error={errors.date_due}
              required
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

        {/* Způsob platby – dle původní logiky pro 2,4 */}
        {showPaymentMethod && (
          <Grid item xs={6}>
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

        {/* Variabilní symbol – jen 2,4 (povinné) */}
        {requireInvoiceFields24 && (
          <Grid item xs={6}>
            <ValidatedTextField
              label="Variabilní symbol"
              name="variable_symbol"
              value={variableSymbol}
              onChange={(e) => onChange("variable_symbol", e.target.value)}
              onBlur={() => onBlur("variable_symbol")}
              error={errors.variable_symbol}
              required
              fullWidth
            />
          </Grid>
        )}
      </Grid>
    </FormSection>
  );
}
