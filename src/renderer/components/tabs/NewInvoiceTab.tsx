import { useState, useEffect } from "react";
import { Box, IconButton, Tooltip, Button, Typography } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import { InvoiceHeader } from "../invoice/InvoiceHeader";
import { InvoiceContactInfo } from "../invoice/InvoiceContactInfo";
import { InvoiceItemsList } from "../invoice/InvoiceItemsList";
import { FormSection } from "../common/form/FormSection";
import { ItemPickerDialog } from "../invoice/new/ItemPickerDialog";
import { ItemAmountPriceDialog } from "../invoice/new/ItemAmountPriceDialog";
import { ContactPickerDialog } from "../invoice/new/ContactPickerDialog";
import { AlertDialog } from "../common/dialog/AlertDialog";
import { useInvoiceForm } from "../../../hooks/useInvoiceForm";
import { useInvoiceDialogs } from "../../../hooks/useInvoiceDialogs";
import { useCreateInvoice, useMaxInvoiceNumber } from "../../../hooks/useInvoices";
import { useCreateStockMovement } from "../../../hooks/useStockMovement";
import type { Item, Contact } from "../../../types/database";
import type { InvoiceItem } from "../../../hooks/useInvoiceForm";
import {
	calculateTotalWithoutVat,
	calculateTotalWithVat,
} from "../../../utils/formUtils";
import { InvoiceTotals } from "../invoice/InvoiceTotals";
import { INVOICE_PREFIX_DEFAULTS } from "../../../config/constants";

function NewInvoiceTab() {
	const form = useInvoiceForm();
	const dialogs = useInvoiceDialogs();
	const createInvoice = useCreateInvoice();
	const createStockMovement = useCreateStockMovement();
	const { data: maxNumber = 0 } = useMaxInvoiceNumber(form.formData.type ?? 1);

	const [alertDialog, setAlertDialog] = useState<{
		open: boolean;
		title: string;
		message: string;
	} | null>(null);

	const isType5 = form.formData.type === 5;

	// Auto-populate prefix when type changes
	useEffect(() => {
		const defaultPrefix = INVOICE_PREFIX_DEFAULTS[form.formData.type as number];
		if (defaultPrefix && form.formData.prefix !== defaultPrefix) {
			form.handleChange("prefix", defaultPrefix);
		}
	}, [form.formData.type]);

	// Auto-increment invoice number based on type
	useEffect(() => {
		if (maxNumber !== undefined) {
			const nextNumber = String(maxNumber + 1).padStart(4, '0');
			if (form.formData.number !== nextNumber) {
				form.handleChange('number', nextNumber);
			}
		}
	}, [maxNumber, form.formData.type]);

	const handleSelectItem = (item: Item) => {
		const existingIndex = form.invoiceItems.findIndex(
			(i) => i.ean === item.ean,
		);

		if (existingIndex !== -1) {
			// Item already exists - open edit dialog
			const existing = form.invoiceItems[existingIndex];
			dialogs.amountPrice.openDialog(item, {
				amount: existing.amount,
				price: existing.sale_price,
				p_group_index: existing.p_group_index,
				index: existingIndex,
			});
		} else {
			// New item - open with defaults
			dialogs.amountPrice.openDialog(item);
		}
	};

	const handleEditItem = (item: InvoiceItem) => {
		const index = form.invoiceItems.findIndex((i) => i.ean === item.ean);
		dialogs.amountPrice.openDialog(item, {
			amount: item.amount,
			price: item.sale_price,
			p_group_index: item.p_group_index,
			index,
		});
	};

	const handleConfirmAmountPrice = (
		amount: number,
		price: number,
		p_group_index: number,
	) => {
		if (!dialogs.amountPrice.selectedItem) return;

		if (amount === 0) {
			// Remove item if amount is 0
			if (dialogs.amountPrice.editingItemIndex !== null) {
				form.handleDeleteItem(
					form.invoiceItems[dialogs.amountPrice.editingItemIndex],
				);
			}
			dialogs.amountPrice.closeDialog(true); // reopen picker
			return;
		}

		if (dialogs.amountPrice.editingItemIndex !== null) {
			form.handleUpdateItem(
				dialogs.amountPrice.editingItemIndex,
				dialogs.amountPrice.selectedItem,
				amount,
				price,
				p_group_index,
			);
			dialogs.amountPrice.closeDialog(true); // reopen picker
		} else {
			form.handleAddItem(
				dialogs.amountPrice.selectedItem,
				amount,
				price,
				p_group_index,
			);
			dialogs.amountPrice.closeDialog(false);
		}
	};

	const handleCloseAmountPriceDialog = () => {
		dialogs.amountPrice.closeDialog(false);
	};

	const handleSelectContact = (contact: Contact) => {
		form.handleSelectContact(contact);
		dialogs.contactPicker.closeDialog();
	};

	const handleSubmit = async () => {
		if (!form.handleValidate()) {
			const errorMessages = Object.entries(form.errors)
				.map(([_, msg]) => `${msg}`)
				.join("\n");

			setAlertDialog({
				open: true,
				title: "Chyby ve formuláři",
				message: `Opravte chyby ve formuláři: \n${errorMessages}`,
			});
			return;
		}

		if (form.invoiceItems.length === 0) {
			setAlertDialog({
				open: true,
				title: "Chybí položky",
				message: "Přidejte alespoň jednu položku",
			});
			return;
		}

		try {
			await createInvoice.mutateAsync({
				number: form.formData.number,
				prefix: form.formData.prefix || undefined,
				type: form.formData.type,
				payment_method: form.formData.payment_method,
				date_issue: form.formData.date_issue,
				date_tax: form.formData.date_tax || undefined,
				date_due: form.formData.date_due || undefined,
				variable_symbol: form.formData.variable_symbol || undefined,
				note: form.formData.note || undefined,
				ico: form.formData.ico || undefined,
				modifier: form.formData.modifier,
				dic: form.formData.dic || undefined,
				company_name: form.formData.company_name || undefined,
				bank_account: form.formData.bank_account || undefined,
				street: form.formData.street || undefined,
				city: form.formData.city || undefined,
				postal_code: form.formData.postal_code || undefined,
				phone: form.formData.phone || undefined,
				email: form.formData.email || undefined,
			});

			await Promise.all(
				form.invoiceItems.map(async (item) => {
					// Check if we should set reset point for this item
					const shouldSetResetPoint =
						await window.electronAPI.stockMovements.shouldSetResetPoint(
							item.ean,
							item.amount.toString(),
						);
					console.log(`Should set reset point for ${item.ean}: ${shouldSetResetPoint}`);

					return createStockMovement.mutateAsync({
						invoice_number: form.formData.number,
						item_ean: item.ean,
						amount: item.amount.toString(),
						price_per_unit: item.sale_price.toString(),
						vat_rate: item.vat_rate,
						reset_point: shouldSetResetPoint,
					});
				}),
			);

			form.handleReset();

			setAlertDialog({
				open: true,
				title: "Úspěch",
				message: "Doklad byl úspěšně vytvořen",
			});
		} catch (error) {
			console.error("Failed to create invoice:", error);

			setAlertDialog({
				open: true,
				title: "Chyba",
				message: `Chyba při vytváření dokladu: ${(error as Error).message}`,
			});
		}
	};

	return (
		<Box sx={{ height: "100%", display: "flex", overflow: "hidden" }}>
			{/* Left Column - Header & Contact Info */}
			<Box
				sx={{
					width: isType5 ? 0 : 480,
					flexShrink: 0,
					p: 3,
					overflowY: "auto",
					borderRight: (theme) => `1px solid ${theme.palette.divider}`,
					display: isType5 ? "none" : "block",
				}}
			>
				<Box sx={{ mb: 3 }}>
					<InvoiceHeader
						type={form.formData.type}
						number={form.formData.number}
						prefix={form.formData.prefix}
						paymentMethod={form.formData.payment_method}
						dateIssue={form.formData.date_issue}
						dateTax={form.formData.date_tax}
						dateDue={form.formData.date_due}
						variableSymbol={form.formData.variable_symbol}
						errors={form.errors}
						onChange={form.handleChange}
						onBlur={form.handleBlur}
					/>
				</Box>

				<InvoiceContactInfo
					type={form.formData.type}
					ico={form.formData.ico}
					modifier={form.formData.modifier}
					dic={form.formData.dic}
					companyName={form.formData.company_name}
					street={form.formData.street}
					city={form.formData.city}
					postalCode={form.formData.postal_code}
					phone={form.formData.phone}
					email={form.formData.email}
					bankAccount={form.formData.bank_account}
					errors={form.errors}
					onChange={form.handleChange}
					onBlur={form.handleBlur}
					onOpenContactPicker={dialogs.contactPicker.openDialog}
				/>
			</Box>

			{/* Right Column - Items Table & Totals */}
			<Box
				sx={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				}}
			>
				{/* Header for Type 5 */}
				{isType5 && (
					<Box sx={{ p: 4, px: 105, pb: 2 }}>
						<InvoiceHeader
							type={form.formData.type}
							number={form.formData.number}
							prefix={form.formData.prefix}
							paymentMethod={form.formData.payment_method}
							dateIssue={form.formData.date_issue}
							dateTax={form.formData.date_tax}
							dateDue={form.formData.date_due}
							variableSymbol={form.formData.variable_symbol}
							errors={form.errors}
							onChange={form.handleChange}
							onBlur={form.handleBlur}
						/>
					</Box>
				)}

				{/* Items Table - Stretches to fill space */}
				<Box
					sx={{
						flex: 1,
						minHeight: 0,
						p: 3,
						px: isType5 ? 40 : 3,
						pt: isType5 ? 2 : 3,
						display: "flex",
						flexDirection: "column",
						overflowY: "scroll",
					}}
				>
					<FormSection
						hideDivider
						title="Položky dokladu"
						actions={
							<Tooltip title="Přidat položku ze skladu">
								<IconButton
									size="small"
									color="primary"
									onClick={dialogs.itemPicker.openDialog}
								>
									<InventoryIcon sx={{ width: 24 }} />
								</IconButton>
							</Tooltip>
						}
					>
						<Box sx={{ height: "100%", minHeight: 400 }}>
							<InvoiceItemsList
								items={form.invoiceItems}
								onEditItem={handleEditItem}
								onDeleteItem={form.handleDeleteItem}
							/>
						</Box>
					</FormSection>
				</Box>

				{/* Totals & Buttons */}
				<Box
					sx={{
						borderTop: (theme) => `1px solid ${theme.palette.divider}`,
						bgcolor: "background.paper",
					}}
				>
					{/* Totals */}
					<InvoiceTotals items={form.invoiceItems} />

					{/* Buttons */}
					<Box
						sx={{
							px: 4,
							py: 2,
							display: "flex",
							justifyContent: "flex-end",
							gap: 2,
						}}
					>
						<Button variant="outlined" onClick={form.handleReset} size="large">
							Zrušit
						</Button>
						<Button
							variant="contained"
							onClick={handleSubmit}
							disabled={
								createInvoice.isPending || form.invoiceItems.length === 0
							}
							size="large"
						>
							Vytvořit doklad
						</Button>
					</Box>
				</Box>
			</Box>

			<ItemPickerDialog
				open={dialogs.itemPicker.open}
				onClose={dialogs.itemPicker.closeDialog}
				onSelect={handleSelectItem}
				selectedItemEans={new Set(form.invoiceItems.map((i) => i.ean))}
			/>

			<ItemAmountPriceDialog
				open={dialogs.amountPrice.open}
				onClose={handleCloseAmountPriceDialog}
				onConfirm={handleConfirmAmountPrice}
				item={dialogs.amountPrice.selectedItem}
				invoiceType={form.formData.type}
				contactPriceGroup={form.selectedContact?.price_group}
				initialAmount={dialogs.amountPrice.editingItemData?.amount}
				initialPrice={dialogs.amountPrice.editingItemData?.price}
				initialPriceGroup={dialogs.amountPrice.editingItemData?.p_group_index}
			/>

			<ContactPickerDialog
				open={dialogs.contactPicker.open}
				onClose={dialogs.contactPicker.closeDialog}
				onSelect={handleSelectContact}
				singleSelect={true}
			/>

			<AlertDialog
				open={alertDialog?.open || false}
				title={alertDialog?.title || ""}
				message={alertDialog?.message || ""}
				onConfirm={() => setAlertDialog(null)}
			/>
		</Box>
	);
}

export default NewInvoiceTab;