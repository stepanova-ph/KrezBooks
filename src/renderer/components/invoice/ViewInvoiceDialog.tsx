import { Box } from "@mui/material";
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
import { InvoiceTotals } from "./InvoiceTotals";
import { getDisplayAmount } from "../../../utils/typeConverterUtils";
import { InvoicePrintButtons } from "./InvoicePrintButton";

interface ViewInvoiceDialogProps {
	open: boolean;
	onClose: () => void;
	invoicePrefix: string;
	invoiceNumber: string;
}

export function ViewInvoiceDialog({
	open,
	onClose,
	invoicePrefix,
	invoiceNumber,
}: ViewInvoiceDialogProps) {
	const { data: invoice, isLoading: invoiceLoading } = useInvoice(
		invoicePrefix,
		invoiceNumber,
	);
	const { data: movements = [], isLoading: movementsLoading } =
		useStockMovementsByInvoice(invoice?.prefix || "", invoiceNumber);
	const { data: allItems = [] } = useItems();

	const isLoading = invoiceLoading || movementsLoading;
	const isType5 = invoice?.type === 5;

	const invoiceItems: InvoiceItem[] = movements.map((movement) => {
		const item = allItems.find((i) => i.ean === movement.item_ean);
		return {
			ean: movement.item_ean,
			name: item?.name || movement.item_ean,
			category: item?.category || "",
			unit_of_measure: item?.unit_of_measure || "ks",
			vat_rate: movement.vat_rate,
			amount: getDisplayAmount(movement.amount, invoice.type),
			sale_price: Number(movement.price_per_unit),
			total:
				getDisplayAmount(movement.amount, invoice.type) *
				Number(movement.price_per_unit),
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
								prefix={invoice.prefix}
								paymentMethod={invoice.payment_method}
								dateIssue={invoice.date_issue}
								dateTax={invoice.date_tax}
								dateDue={invoice.date_due}
								variableSymbol={invoice.variable_symbol}
								errors={{}}
								onChange={() => {}}
								onBlur={() => {}}
								disabled
								headerAction={
									<InvoicePrintButtons
										variant="icon"
										invoicePrefix={invoice.prefix}
										invoiceNumber={invoice.number}
										invoiceEmail={invoice.email || ""}
									/>
								}
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
									prefix={invoice.prefix}
									paymentMethod={invoice.payment_method}
									dateIssue={invoice.date_issue}
									dateTax={invoice.date_tax}
									dateDue={invoice.date_due}
									variableSymbol={invoice.variable_symbol}
									errors={{}}
									onChange={() => {}}
									onBlur={() => {}}
									disabled
									headerAction={
										<InvoicePrintButtons
											variant="icon"
											invoicePrefix={invoice.prefix}
											invoiceNumber={invoice.number}
											invoiceEmail={invoice.email || ""}
										/>
									}
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

						<InvoiceTotals items={invoiceItems} />
					</Box>
				</Box>
			)}
		</Dialog>
	);
}
