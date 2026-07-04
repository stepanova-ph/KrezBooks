import { useState, useEffect } from "react";
import { Box, Chip, IconButton, Tooltip, Button, Typography } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import { InvoiceHeader } from "../invoice/InvoiceHeader";
import { InvoiceContactInfo } from "../invoice/InvoiceContactInfo";
import { InvoiceItemsList } from "../invoice/InvoiceItemsList";
import { FormSection } from "../common/form/FormSection";
import { ItemPickerDialog } from "../invoice/new/ItemPickerDialog";
import { ItemAmountPriceDialog } from "../invoice/new/ItemAmountPriceDialog";
import { ContactPickerDialog } from "../invoice/new/ContactPickerDialog";
import { ErrorBoundary } from "../ErrorBoundary";
import { AlertDialog } from "../common/dialog/AlertDialog";
import { InfoDialog } from "../common/dialog/InfoDialog";
import { InvoiceSuccessDialog } from "../invoice/InvoiceSuccessDialog";
import { DiscountDialog } from "../invoice/DiscountDialog";
import { useInvoiceForm } from "../../../hooks/useInvoiceForm";
import { useInvoiceDialogs } from "../../../hooks/useInvoiceDialogs";
import {
	useCreateInvoiceWithStockMovements,
	useMaxInvoiceNumber,
} from "../../../hooks/useInvoices";
import type { Item, Contact } from "../../../types/database";
import type { InvoiceItem } from "../../../hooks/useInvoiceForm";
import {
	calculateTotalWithoutVat,
	calculateTotalWithVat,
} from "../../../utils/formUtils";
import { InvoiceTotals } from "../invoice/InvoiceTotals";
import { INVOICE_TYPES } from "../../../config/constants";
import {
	getDisplayAmount,
	getSignedAmount,
} from "../../../utils/typeConverterUtils";
import { ItemCardDialog } from "../items/ItemCardDialog";
import theme from "src/lib/theme";

function NewInvoiceTab() {
	const form = useInvoiceForm();
	const dialogs = useInvoiceDialogs();
	const createInvoiceWithStockMovements = useCreateInvoiceWithStockMovements();
	const { data: maxNumber = 0 } = useMaxInvoiceNumber(form.formData.type ?? 1);

	const [viewingItemEan, setViewingItemEan] = useState<string | null>(null);
	const [alertDialog, setAlertDialog] = useState<{
		open: boolean;
		title: string;
		message: string;
	} | null>(null);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	const [showInvoiceSuccessDialog, setShowInvoiceSuccessDialog] =
		useState(false);
	const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
	const [createdInvoiceInfo, setCreatedInvoiceInfo] = useState<{
		prefix: string;
		number: string;
		email?: string;
		type: number;
	} | null>(null);

	const isType5 = form.formData.type === 5;
	const isSaleInvoice = form.formData.type === 3 || form.formData.type === 4;
	const isReturnInvoice = form.formData.type === 6;

	useEffect(() => {
		const invoiceType = INVOICE_TYPES.find(
			(t) => t.value === form.formData.type,
		);
		const defaultPrefix = invoiceType?.prefix;
		if (defaultPrefix && form.formData.prefix !== defaultPrefix) {
			form.handleChange("prefix", defaultPrefix);
		}
	}, [form.formData.type, form.formData.prefix, form.handleChange]);

	useEffect(() => {
		if (maxNumber !== undefined) {
			const nextNumber = String(maxNumber + 1).padStart(4, "0");
			if (form.formData.number !== nextNumber) {
				form.handleChange("number", nextNumber);
			}
		}
	}, [maxNumber, form.formData.type, form.formData.number, form.handleChange]);

	// Currency change warning
	useEffect(() => {
		if (form.invoiceItems.length > 0) {
			// Show warning that prices may need to be updated
			// User can choose to continue or cancel currency change
		}
	}, [form.formData.is_in_eur, form.invoiceItems.length]);

	const handleSelectItem = (item: Item) => {
		const existingIndex = form.invoiceItems.findIndex(
			(i) => i.ean === item.ean,
		);

		if (existingIndex !== -1) {
			const existing = form.invoiceItems[existingIndex];
			dialogs.amountPrice.openDialog(item, {
				amount: getDisplayAmount(existing.amount, form.formData.type),
				price: existing.sale_price,
				p_group_index: existing.p_group_index,
				index: existingIndex,
			});
		} else {
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
			if (dialogs.amountPrice.editingItemIndex !== null) {
				form.handleDeleteItem(
					form.invoiceItems[dialogs.amountPrice.editingItemIndex],
				);
			}
			dialogs.amountPrice.closeDialog(true);
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
			dialogs.amountPrice.closeDialog(true);
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
		const validationResult = form.handleValidate();
		if (!validationResult.valid) {
			const errorMessages = Object.values(validationResult.errors).join("\n");

			setAlertDialog({
				open: true,
				title: "Chyby ve formuláři",
				message: `Opravte chyby ve formuláři:\n${errorMessages}`,
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
			const resetPointResult = await window.electronAPI.stockMovements.shouldSetResetPointBatch(
				form.invoiceItems.map((item) => ({
					itemEan: item.ean,
					// Must be the signed amount (negative for sales) — the service adds it
					// to current stock to detect crossing from positive to <= 0
					newAmount: getSignedAmount(item.amount, form.formData.type),
				})),
			);
			const resetPoints = resetPointResult.data ?? {};

			const stockMovements = form.invoiceItems.map((item) => ({
				invoice_prefix: form.formData.prefix || "",
				invoice_number: form.formData.number,
				item_ean: item.ean,
				amount: getSignedAmount(item.amount, form.formData.type) as unknown as number,
				price_per_unit: item.sale_price.toString() as unknown as number,
				vat_rate: item.vat_rate,
				reset_point: resetPoints[item.ean] ?? false,
			}));

			await createInvoiceWithStockMovements.mutateAsync({
				invoice: {
					number: form.formData.number,
					prefix: form.formData.prefix || "",
					type: form.formData.type,
					payment_method: form.formData.payment_method,
					date_issue: form.formData.date_issue,
					date_tax: form.formData.date_tax || undefined,
					date_due: form.formData.date_due || undefined,
					variable_symbol: form.formData.variable_symbol || undefined,
					order_number: form.formData.order_number || undefined,
					note: form.formData.note || undefined,
					is_in_eur: form.formData.is_in_eur,
					discount: isSaleInvoice ? form.formData.discount : null,
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
				},
				stockMovements,
			});

			const invoiceIdentifier = form.formData.prefix
				? `${form.formData.prefix}${form.formData.number}`
				: form.formData.number;

			// For sale invoices (types 3 & 4) and dobropis (type 6), show the invoice success dialog with preview
			if (isSaleInvoice || isReturnInvoice) {
				setCreatedInvoiceInfo({
					prefix: form.formData.prefix || "",
					number: form.formData.number,
					email: form.formData.email,
					type: form.formData.type,
				});
				setShowInvoiceSuccessDialog(true);
			} else {
				// For other invoice types, show simple success dialog
				setSuccessMessage(
					`Doklad č. ${invoiceIdentifier} byl úspěšně vytvořen.`,
				);
				setShowSuccessDialog(true);
			}

			form.handleReset();
		} catch (error) {
			console.error("Failed to create invoice:", error);

			setAlertDialog({
				open: true,
				title: "Chyba",
				message: `Chyba při vytvářfení dokladu: ${(error as Error).message}`,
			});
		}
	};

	return (
		<Box sx={{ height: "100%", display: "flex", overflow: "hidden" }}>
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
						orderNumber={form.formData.order_number}
						note={form.formData.note}
						isInEur={form.formData.is_in_eur}
						errors={form.errors}
						onChange={form.handleChange}
						onBlur={form.handleBlur}
						headerAction={
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								{isSaleInvoice && (
									<Chip
										label={
											form.formData.discount != null
												? `Sleva ${form.formData.discount} %`
												: "Sleva"
										}
										color={form.formData.discount != null ? "primary" : "default"}
										variant={form.formData.discount != null ? "filled" : "outlined"}
										onClick={() => setDiscountDialogOpen(true)}
										sx={{ fontWeight: 600, height: "35px", borderRadius: "17.5px" }}
									/>
								)}
								<IconButton
									size="small"
									onClick={() => form.handleChange("is_in_eur", !form.formData.is_in_eur)}
									sx={{
										borderRadius: "50%",
										aspectRatio: "1 / 1",
										p: 1,
										fontWeight: 700,
										minHeight: "35px",
										color: "primary.main",
									}}
								>
									{form.formData.is_in_eur ? "€" : "Kč"}
								</IconButton>
							</Box>
						}
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

			<Box
				sx={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				}}
			>
				{isType5 && (
					<Box sx={{ p: 4, px: 100, pb: 2 }}>
						<InvoiceHeader
							type={form.formData.type}
							number={form.formData.number}
							prefix={form.formData.prefix}
							paymentMethod={form.formData.payment_method}
							dateIssue={form.formData.date_issue}
							dateTax={form.formData.date_tax}
							dateDue={form.formData.date_due}
							variableSymbol={form.formData.variable_symbol}
							orderNumber={form.formData.order_number}
							note={form.formData.note}
							isInEur={form.formData.is_in_eur}
							errors={form.errors}
							onChange={form.handleChange}
							onBlur={form.handleBlur}
							headerAction={
								<Button
									size="small"
									onClick={() => form.handleChange("is_in_eur", !form.formData.is_in_eur)}
									sx={{
										minWidth: "auto",
										px: 1.5,
										fontWeight: 600,
										fontSize: "0.9rem",
										color: "text.primary",
										"&:hover": {
											bgcolor: "action.hover",
										},
									}}
								>
									{form.formData.is_in_eur ? "€" : "Kč"}
								</Button>
							}
						/>
					</Box>
				)}

				<Box
					sx={{
						flex: 1,
						minHeight: 0,
						p: 3,
						px: isType5 ? 40 : 3,
						pt: isType5 ? 2 : 3,
						display: "flex",
						flexDirection: "column",
					}}
				>
					<FormSection
						hideDivider
						title="Položky dokladu"
						actions={
							<Tooltip title="Přidat položку ze skladu">
								<IconButton
									size="small"
									color="primary"
									onClick={dialogs.itemPicker.openDialog}
								>
									<InventoryIcon sx={{ width: 24 }} />
								</IconButton>
							</Tooltip>
						}
						sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
					>
						<InvoiceItemsList
							items={form.invoiceItems}
							onEditItem={handleEditItem}
							onDeleteItem={form.handleDeleteItem}
							onOpenItemCard={(item) => setViewingItemEan(item.ean)}
							isInEur={form.formData.is_in_eur}
							invoiceType={form.formData.type}
							maxHeight="fill"
						/>
					</FormSection>
				</Box>

				<Box
					sx={{
						borderTop: (theme) => `1px solid ${theme.palette.divider}`,
						bgcolor: "background.paper",
					}}
				>
					<InvoiceTotals
						items={form.invoiceItems}
						isInEur={form.formData.is_in_eur}
						invoiceType={form.formData.type}
						discount={isSaleInvoice ? form.formData.discount : null}
					/>

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
							Vymazat formulář
						</Button>
						<Button
							variant="contained"
							onClick={handleSubmit}
							disabled={
								createInvoiceWithStockMovements.isPending || form.invoiceItems.length === 0
							}
							size="large"
						>
							Vytvořit doklad
						</Button>
					</Box>
				</Box>
			</Box>

			<ErrorBoundary fallback={(_, reset) => { dialogs.itemPicker.closeDialog(); reset(); return null; }}>
				<ItemPickerDialog
					open={dialogs.itemPicker.open}
					onClose={dialogs.itemPicker.closeDialog}
					onSelect={handleSelectItem}
					selectedItemEans={new Set(form.invoiceItems.map((i) => i.ean))}
				/>
			</ErrorBoundary>

			<ErrorBoundary fallback={(_, reset) => { handleCloseAmountPriceDialog(); reset(); return null; }}>
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
					isInEur={form.formData.is_in_eur}
				/>
			</ErrorBoundary>

			<ErrorBoundary fallback={(_, reset) => { dialogs.contactPicker.closeDialog(); reset(); return null; }}>
				<ContactPickerDialog
					open={dialogs.contactPicker.open}
					onClose={dialogs.contactPicker.closeDialog}
					onSelect={handleSelectContact}
					singleSelect={true}
				/>
			</ErrorBoundary>

			<DiscountDialog
				open={discountDialogOpen}
				onClose={() => setDiscountDialogOpen(false)}
				onConfirm={(discount) => form.handleChange("discount", discount)}
				initialDiscount={form.formData.discount}
			/>

			<AlertDialog
				open={alertDialog?.open || false}
				title={alertDialog?.title || ""}
				message={alertDialog?.message || ""}
				onConfirm={() => setAlertDialog(null)}
			/>

			<InfoDialog
				open={showSuccessDialog}
				title="Úspěch"
				message={successMessage}
				onConfirm={() => setShowSuccessDialog(false)}
			/>

			{createdInvoiceInfo && (
				<InvoiceSuccessDialog
					open={showInvoiceSuccessDialog}
					onClose={() => {
						setShowInvoiceSuccessDialog(false);
						setCreatedInvoiceInfo(null);
					}}
					invoicePrefix={createdInvoiceInfo.prefix}
					invoiceNumber={createdInvoiceInfo.number}
					invoiceEmail={createdInvoiceInfo.email}
					invoiceType={createdInvoiceInfo.type}
				/>
			)}

			{viewingItemEan && (
				<ItemCardDialog
					open={!!viewingItemEan}
					onClose={() => setViewingItemEan(null)}
					itemEan={viewingItemEan}
				/>
			)}
		</Box>
	);
}

export default NewInvoiceTab;
