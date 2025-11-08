import { Box, Typography } from "@mui/material";
import { Dialog } from "../common/dialog/Dialog";
import { useInvoice } from "../../../hooks/useInvoices";
import { useStockMovementsByInvoice } from "../../../hooks/useStockMovement";
import { useItems } from "../../../hooks/useItems";
import { FormSection } from "../common/form/FormSection";
import { InvoiceHeader } from "./InvoiceHeader";
import { InvoiceContactInfo } from "./InvoiceContactInfo";
import { InvoiceItemsList } from "./InvoiceItemsList";
import { Loading } from "../layout/Loading";
import type { InvoiceItem } from "../../../hooks/useInvoiceForm";
import {
	calculateTotalWithoutVat,
	calculateTotalWithVat,
} from "../../../utils/formUtils";

interface ViewInvoiceDialogProps {
	open: boolean;
	onClose: () => void;
	invoiceNumber: string;
}

export function ViewInvoiceDialog({
	open,
	onClose,
	invoiceNumber,
}: ViewInvoiceDialogProps) {
	const { data: invoice, isLoading: invoiceLoading } =
		useInvoice(invoiceNumber);
	const { data: movements = [], isLoading: movementsLoading } =
		useStockMovementsByInvoice(invoiceNumber);
	const { data: allItems = [] } = useItems();

	const isLoading = invoiceLoading || movementsLoading;
	const isType5 = invoice?.type === 5;

	// Transform stock movements into InvoiceItems
	const invoiceItems: InvoiceItem[] = movements.map((movement) => {
		const item = allItems.find((i) => i.ean === movement.item_ean);
		return {
			ean: movement.item_ean,
			name: item?.name || movement.item_ean,
			category: item?.category || "",
			unit_of_measure: item?.unit_of_measure || "ks",
			vat_rate: movement.vat_rate,
			amount: Number(movement.amount),
			sale_price: Number(movement.price_per_unit),
			total: Number(movement.amount) * Number(movement.price_per_unit),
			p_group_index: 1,
			note: item?.note,
			sale_price_group1: item?.sale_price_group1 || 0,
			sale_price_group2: item?.sale_price_group2 || 0,
			sale_price_group3: item?.sale_price_group3 || 0,
			sale_price_group4: item?.sale_price_group4 || 0,
		};
	});

	if (!invoice) return null;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={`Zobrazit doklad ${invoice.number}`}
			maxWidth="xl"
			fullWidth
		>
			{isLoading ? (
				<Loading text="Načítám doklad..." />
			) : (
				<Box sx={{ height: "70vh", display: "flex", overflow: "hidden" }}>
					{/* Left Column - Header & Contact Info */}
					<Box
						sx={{
							width: isType5 ? 0 : 450,
							flexShrink: 0,
							p: 3,
							overflowY: "auto",
							borderRight: (theme) => `1px solid ${theme.palette.divider}`,
							display: isType5 ? "none" : "block",
						}}
					>
						<Box sx={{ mb: 3 }}>
							<InvoiceHeader
								type={invoice.type}
								number={invoice.number}
								paymentMethod={invoice.payment_method}
								dateIssue={invoice.date_issue}
								dateTax={invoice.date_tax}
								dateDue={invoice.date_due}
								variableSymbol={invoice.variable_symbol}
								errors={{}}
								onChange={() => {}}
								onBlur={() => {}}
								disabled
							/>
						</Box>

						<InvoiceContactInfo
							type={invoice.type}
							ico={invoice.ico || ""}
							modifier={invoice.modifier}
							dic={invoice.dic || ""}
							companyName={invoice.company_name || ""}
							street={invoice.street || ""}
							city={invoice.city || ""}
							postalCode={invoice.postal_code || ""}
							phone={invoice.phone || ""}
							email={invoice.email || ""}
							bankAccount={invoice.bank_account || ""}
							errors={{}}
							onChange={() => {}}
							onBlur={() => {}}
							onOpenContactPicker={() => {}}
							disabled
							hideContactPicker
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
							<Box sx={{ p: 3, pb: 2 }}>
								<InvoiceHeader
									type={invoice.type}
									number={invoice.number}
									paymentMethod={invoice.payment_method}
									dateIssue={invoice.date_issue}
									dateTax={invoice.date_tax}
									dateDue={invoice.date_due}
									variableSymbol={invoice.variable_symbol}
									errors={{}}
									onChange={() => {}}
									onBlur={() => {}}
									disabled
								/>
							</Box>
						)}

						{/* Items Table - Stretches to fill space */}
						<Box
							sx={{
								flex: 1,
								minHeight: 0,
								p: 3,
								pt: isType5 ? 2 : 3,
								display: "flex",
								flexDirection: "column",
								overflowY: "scroll",
							}}
						>
							<FormSection title="Položky dokladu" hideDivider>
								<Box
									sx={{
										height: "100%",
										display: "flex",
										flexDirection: "column",
										minHeight: 400,
									}}
								>
									<InvoiceItemsList
										items={invoiceItems}
										onEditItem={() => {}}
										onDeleteItem={() => {}}
										readOnly={true}
									/>
								</Box>
							</FormSection>
						</Box>

						{/* Totals */}
						<Box
							sx={{
								borderTop: (theme) => `1px solid ${theme.palette.divider}`,
								bgcolor: "background.paper",
							}}
						>
							<Box
								sx={{
									px: 4,
									py: 2.5,
									display: "flex",
									justifyContent: "flex-end",
									gap: 8,
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
									<Typography
										variant="body1"
										fontWeight={500}
										color="text.secondary"
									>
										Celkem bez DPH:
									</Typography>
									<Typography variant="h6" fontWeight={700}>
										{calculateTotalWithoutVat(invoiceItems).toFixed(2)} Kč
									</Typography>
								</Box>
								<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
									<Typography
										variant="body1"
										fontWeight={500}
										color="text.secondary"
									>
										Celkem s DPH:
									</Typography>
									<Typography
										variant="h6"
										fontWeight={700}
										color="primary.main"
									>
										{calculateTotalWithVat(invoiceItems).toFixed(2)} Kč
									</Typography>
								</Box>
							</Box>
						</Box>
					</Box>
				</Box>
			)}
		</Dialog>
	);
}
