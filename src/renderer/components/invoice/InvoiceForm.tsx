// import { useState } from "react";
// import { Box, Grid } from "@mui/material";
// import { FormDialog } from "../common/form/FormDialog";
// import { FormSection } from "../common/form/FormSection";
// import ValidatedTextField from "../common/inputs/ValidatedTextField";
// import { InvoiceHeader } from "./InvoiceHeader";
// import { InvoiceContactInfo } from "./InvoiceContactInfo";
// import { InvoiceItemsTable } from "./InvoiceItemsTable";
// import { invoiceSchema } from "../../../validation/invoiceSchema";
// import { splitDIC, combineDIC } from "../../../utils/formUtils";
// import type { CreateInvoiceInput, Invoice } from "../../../types/database";

// interface InvoiceFormProps {
//   open: boolean;
//   onClose: () => void;
//   onSubmit: (data: CreateInvoiceInput) => Promise<void>;
//   initialData?: Partial<Invoice>;
//   mode: "create" | "edit";
//   isPending?: boolean;
// }

// const defaultFormData: CreateInvoiceInput = {
//   number: "",
//   type: 3,
//   payment_method: 0,
//   date_issue: new Date().toISOString().split("T")[0],
//   date_tax: new Date().toISOString().split("T")[0],
//   date_due: "",
//   variable_symbol: "",
//   note: "",
//   ico: "",
//   modifier: undefined,
//   dic: "",
//   company_name: "",
//   bank_account: "",
//   street: "",
//   city: "",
//   postal_code: "",
//   phone: "",
//   email: "",
// };

// export function InvoiceForm({
//   open,
//   onClose,
//   onSubmit,
//   initialData,
//   mode,
//   isPending = false,
// }: InvoiceFormProps) {
//   const initialDIC = splitDIC(initialData?.dic);

//   const [formData, setFormData] = useState<CreateInvoiceInput>(
//     initialData ? { ...defaultFormData, ...initialData } : defaultFormData
//   );
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [dicParts, setDicParts] = useState<{ prefix: string | null; value: string }>(
//     initialDIC
//   );

//   const handleChange = (field: string, value: string | number) => {
//     if (errors[field]) {
//       setErrors((prev) => ({ ...prev, [field]: "" }));
//     }
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleDicChange = (field: "prefix" | "value", value: string | null) => {
//     if (errors.dic) {
//       setErrors((prev) => ({ ...prev, dic: "" }));
//     }

//     setDicParts((prev) => {
//       const updated = {
//         ...prev,
//         [field]: field === "prefix" ? value || null : value,
//       };

//       if (field === "prefix") {
//         updated.value = value ? prev.value : "";
//       }

//       setFormData((prevForm) => ({
//         ...prevForm,
//         dic: combineDIC(updated.prefix, updated.value),
//       }));
//       return updated;
//     });
//   };

//   const handleBlur = (field: string) => {
//     const result = invoiceSchema.safeParse(formData);
//     if (!result.success) {
//       const fieldError = result.error.issues.find(
//         (err) => err.path[0] === field
//       );
//       if (fieldError) {
//         setErrors((prev) => ({ ...prev, [field]: fieldError.message }));
//       }
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setErrors({});

//     const dataToValidate = {
//       ...formData,
//       dic: combineDIC(dicParts.prefix, dicParts.value),
//     };

//     const result = invoiceSchema.safeParse(dataToValidate);
//     if (!result.success) {
//       const fieldErrors: Record<string, string> = {};
//       result.error.issues.forEach((err) => {
//         if (typeof err.path[0] === "string") {
//           fieldErrors[err.path[0]] = err.message;
//         }
//       });
//       setErrors(fieldErrors);
//       return;
//     }

//     try {
//       await onSubmit(result.data as CreateInvoiceInput);
//       if (mode === "create") {
//         setFormData(defaultFormData);
//         setDicParts({ prefix: null, value: "" });
//       }
//     } catch (error) {
//       console.error("Chyba při ukládání dokladu:", error);
//       alert(`Chyba při ukládání: ${(error as Error).message}`);
//     }
//   };

//   const handleSelectContact = () => {
//     console.log("Vybrat kontakt z adresáře - funkce bude doplněna později");
//   };

//   const handleSelectItem = () => {
//     console.log("Vybrat položku ze skladu - funkce bude doplněna později");
//   };

//   const title = mode === "create" ? "Vytvořit nový doklad" : "Upravit doklad";
//   const submitLabel = mode === "create" ? "Vytvořit doklad" : "Uložit změny";

//   return (
//     <Box
//       sx={{
//         position: "absolute",
//         top: 0,
//         left: 0,
//         width: "100%",
//         height: "100%",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         backgroundColor: "rgba(0, 0, 0, 0.5)",
//       }}
//     >
//       <InvoiceHeader
//         number={formData.number}
//         type={formData.type}
//         paymentMethod={formData.payment_method}
//         dateIssue={formData.date_issue}
//         dateTax={formData.date_tax ?? ""}
//         dateDue={formData.date_due ?? ""}
//         variableSymbol={formData.variable_symbol ?? ""}
//         errors={errors}
//         onChange={handleChange}
//         onBlur={handleBlur}
//       />

//       <InvoiceContactInfo
//         type={formData.type}
//         ico={formData.ico ?? ""}
//         modifier={formData.modifier}
//         dic={formData.dic ?? ""}
//         companyName={formData.company_name ?? ""}
//         street={formData.street ?? ""}
//         city={formData.city ?? ""}
//         postalCode={formData.postal_code ?? ""}
//         phone={formData.phone ?? ""}
//         email={formData.email ?? ""}
//         bankAccount={formData.bank_account ?? ""}
//         dicPrefix={dicParts.prefix}
//         dicValue={dicParts.value}
//         errors={errors}
//         onChange={handleChange}
//         onDicChange={handleDicChange}
//         onBlur={handleBlur}
//         onSelectContact={handleSelectContact}
//       />
//       </Box>

//     //   {/* <InvoiceItemsTable items={[]} onSelectItem={handleSelectItem} />

//     //   <FormSection title="Poznámka" hideDivider>
//     //     <Grid container spacing={2}>
//     //       <Grid item xs={12}>
//     //         <ValidatedTextField
//     //           label="Poznámka"
//     //           name="note"
//     //           value={formData.note ?? ""}
//     //           onChange={(e) => handleChange("note", e.target.value)}
//     //           onBlur={() => handleBlur("note")}
//     //           error={errors.note}
//     //           multiline
//     //           rows={3}
//     //           fullWidth
//     //         />
//     //       </Grid>
//     //     </Grid> */}
//     //   {/* </FormSection> */}
//   );
// }
