import { useState } from "react";
import { Box, Grid } from "@mui/material";
import { InvoiceHeader } from "../invoice/InvoiceHeader";
import { InvoiceContactInfo } from "../invoice/InvoiceContactInfo";
import { splitDIC, combineDIC } from "../../../utils/formUtils";
import type { CreateInvoiceInput } from "../../../types/database";

const defaultFormData: CreateInvoiceInput = {
  number: "",
  type: 3,
  payment_method: 0,
  date_issue: new Date().toISOString().split("T")[0],
  date_tax: new Date().toISOString().split("T")[0],
  date_due: "",
  variable_symbol: "",
  note: "",
  ico: "",
  modifier: undefined,
  dic: "",
  company_name: "",
  bank_account: "",
  street: "",
  city: "",
  postal_code: "",
  phone: "",
  email: "",
};

function InvoiceTab() {
  const [formData, setFormData] = useState<CreateInvoiceInput>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dicParts, setDicParts] = useState<{ prefix: string | null; value: string }>(
    splitDIC(formData.dic)
  );

  const isType5 = formData.type === 5;

  const handleChange = (field: string, value: string | number) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDicChange = (field: "prefix" | "value", value: string | null) => {
    if (errors.dic) setErrors((prev) => ({ ...prev, dic: "" }));
    setDicParts((prev) => {
      const updated = { ...prev, [field]: field === "prefix" ? value || null : value };
      if (field === "prefix") updated.value = value ? prev.value : "";
      setFormData((p) => ({ ...p, dic: combineDIC(updated.prefix, updated.value) }));
      return updated;
    });
  };

  const handleBlur = (_field: string) => {};
  const handleSelectContact = () => {
    console.log("Vybrat kontakt z adresáře - funkce bude doplněna později");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={isType5 ? 12 : 6}>
          <InvoiceHeader
            number={formData.number}
            type={formData.type}
            paymentMethod={formData.payment_method}
            dateIssue={formData.date_issue}
            dateTax={formData.date_tax ?? ""}
            dateDue={formData.date_due ?? ""}
            variableSymbol={formData.variable_symbol ?? ""}
            errors={errors}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </Grid>

        {!isType5 && (
          <Grid item xs={12} md={6}>
            <InvoiceContactInfo
              type={formData.type}
              ico={formData.ico ?? ""}
              modifier={formData.modifier}
              dic={formData.dic ?? ""}
              companyName={formData.company_name ?? ""}
              street={formData.street ?? ""}
              city={formData.city ?? ""}
              postalCode={formData.postal_code ?? ""}
              phone={formData.phone ?? ""}
              email={formData.email ?? ""}
              bankAccount={formData.bank_account ?? ""}
              dicPrefix={dicParts.prefix}
              dicValue={dicParts.value}
              errors={errors}
              onChange={handleChange}
              onDicChange={handleDicChange}
              onBlur={handleBlur}
              onSelectContact={handleSelectContact}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default InvoiceTab;
