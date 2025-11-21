import { Box, Typography, Grid, TableCell } from "@mui/material";
import { Dialog } from "../common/dialog/Dialog";
import { FormSection } from "../common/form/FormSection";
import { Loading } from "../layout/Loading";
import { DataTable, Column, ContextMenuAction } from "../common/table/DataTable";
import { VatPriceField } from "../common/inputs/VatPriceField";
import { StockAmountDisplay } from "../common/StockAmountDisplay";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
	useStockMovementsByItem,
	useAverageBuyPriceByItem,
	useLastBuyPriceByItem,
} from "../../../hooks/useStockMovement";
import { useItem } from "../../../hooks/useItems";
import { VAT_RATES } from "../../../config/constants";
import {
	formatPrice,
	formatVatRateShort,
} from "../../../utils/formattingUtils";
import type { StockMovementWithInvoiceInfo } from "../../../types/database";
import { ViewInvoiceDialog } from "../invoice/ViewInvoiceDialog";
import { useState } from "react";

// Format date from ISO string to DD.MM.YYYY
function formatDate(dateStr: string): string {
	if (!dateStr) return "-";
	const [year, month, day] = dateStr.split("-");
	return `${day}.${month}.${year}`;
}

interface ItemCardDialogProps {
	open: boolean;
	onClose: () => void;
	itemEan: string;
}

const movementColumns: Column[] = [
	{ id: "invoice", label: "Doklad", minWidth: 100 },
	{ id: "date_issue", label: "Datum", minWidth: 90 },
	{ id: "contact_ico", label: "IČO", minWidth: 80 },
	{ id: "amount", label: "Množství", minWidth: 70, align: "right" },
	{ id: "price_per_unit", label: "Cena/ks", minWidth: 80, align: "right" },
	{ id: "total", label: "Celkem", minWidth: 90, align: "right" },
];

export function ItemCardDialog({
	open,
	onClose,
	itemEan,
}: ItemCardDialogProps) {
	const { data: item, isLoading: itemLoading } = useItem(itemEan);
	const { data: movements = [], isLoading: movementsLoading } =
		useStockMovementsByItem(itemEan);
	const { data: avgBuyPrice = 0 } = useAverageBuyPriceByItem(itemEan);
	const { data: lastBuyPrice = 0 } = useLastBuyPriceByItem(itemEan);

	const [viewingInvoice, setViewingInvoice] = useState<{
		prefix: string;
		number: string;
	} | null>(null);

	const isLoading = itemLoading || movementsLoading;

	const handleRowDoubleClick = (movement: StockMovementWithInvoiceInfo) => {
		setViewingInvoice({
			prefix: movement.invoice_prefix,
			number: movement.invoice_number,
		});
	};

	const contextMenuActions: ContextMenuAction<StockMovementWithInvoiceInfo>[] = [
		{
			id: "view",
			label: "Zobrazit doklad",
			icon: <VisibilityIcon fontSize="small" />,
			onClick: handleRowDoubleClick,
		},
	];

	const getCellContent = (
		movement: StockMovementWithInvoiceInfo,
		columnId: string
	) => {
		// Convert string values to numbers
		const amount = typeof movement.amount === "string"
			? parseFloat(movement.amount)
			: Number(movement.amount);
		const pricePerUnit = typeof movement.price_per_unit === "string"
			? parseFloat(movement.price_per_unit)
			: Number(movement.price_per_unit);

		switch (columnId) {
			case "invoice":
				return `${movement.invoice_prefix}-${movement.invoice_number}`;
			case "date_issue":
				return formatDate(movement.date_issue);
			case "contact_ico":
				return movement.contact_ico || "-";
			case "amount":
				return String(amount);
			case "price_per_unit":
				return formatPrice(pricePerUnit);
			case "total":
				return formatPrice(Math.abs(amount) * pricePerUnit);
			default:
				return "-";
		}
	};

	if (!item && !isLoading) return null;

	const vatPercentage =
		VAT_RATES[item?.vat_rate as keyof typeof VAT_RATES]?.percentage ?? 21;

	return (
		<>
			<Dialog
				open={open}
				onClose={onClose}
				title={`Karta položky: ${item?.name || ""}`}
				maxWidth="xl"
				fullWidth
			>
				{isLoading || !item ? (
					<Loading text="Načítám kartu položky..." />
				) : (
					<Box sx={{ height: "70vh", display: "flex", overflow: "hidden" }}>
						{/* Left Column - Item Info */}
						<Box
							sx={{
								width: 380,
								flexShrink: 0,
								p: 3,
								overflowY: "auto",
								borderRight: (theme) => `1px solid ${theme.palette.divider}`,
							}}
						>
							{/* Basic Info */}
							<FormSection title="Základní informace">
								<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
									<Box>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block" }}
										>
											EAN
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											{item.ean}
										</Typography>
									</Box>
									<Box>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block" }}
										>
											Název
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											{item.name}
										</Typography>
									</Box>
									<Box sx={{ display: "flex", gap: 3 }}>
										<Box sx={{ flex: 1 }}>
											<Typography
												variant="caption"
												color="text.secondary"
												sx={{ display: "block" }}
											>
												Kategorie
											</Typography>
											<Typography variant="body2">
												{item.category || "-"}
											</Typography>
										</Box>
										<Box>
											<Typography
												variant="caption"
												color="text.secondary"
												sx={{ display: "block" }}
											>
												DPH
											</Typography>
											<Typography variant="body2">
												{formatVatRateShort(item.vat_rate)}
											</Typography>
										</Box>
									</Box>
								</Box>
							</FormSection>

							{/* Buy Prices */}
							<FormSection title="Nákupní ceny" my={2}>
								<Box sx={{ display: "flex", gap: 2 }}>
									<Box sx={{ flex: 1 }}>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block" }}
										>
											Průměrná
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											{formatPrice(avgBuyPrice)}
										</Typography>
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block" }}
										>
											Poslední
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											{formatPrice(lastBuyPrice)}
										</Typography>
									</Box>
								</Box>
							</FormSection>

							{/* Sale Prices */}
							<FormSection title="Prodejní ceny" my={2}>
								<Grid container spacing={1.5}>
									<Grid item xs={12}>
										<VatPriceField
											size="small"
											label="Skupina 1"
											name="sale_price_group1"
											value={item.sale_price_group1}
											vatRate={vatPercentage}
											onChange={() => {}}
											precision={2}
											min={0}
											readonly
										/>
									</Grid>
									<Grid item xs={12}>
										<VatPriceField
											size="small"
											label="Skupina 2"
											name="sale_price_group2"
											value={item.sale_price_group2}
											vatRate={vatPercentage}
											onChange={() => {}}
											precision={2}
											min={0}
											readonly
										/>
									</Grid>
									<Grid item xs={12}>
										<VatPriceField
											size="small"
											label="Skupina 3"
											name="sale_price_group3"
											value={item.sale_price_group3}
											vatRate={vatPercentage}
											onChange={() => {}}
											precision={2}
											min={0}
											readonly
										/>
									</Grid>
									<Grid item xs={12}>
										<VatPriceField
											size="small"
											label="Skupina 4"
											name="sale_price_group4"
											value={item.sale_price_group4}
											vatRate={vatPercentage}
											onChange={() => {}}
											precision={2}
											min={0}
											readonly
										/>
									</Grid>
								</Grid>
							</FormSection>

							{/* Stock Amount */}
							<FormSection title="Stav skladu" my={2}>
								<StockAmountDisplay
									amount={item.stock_amount ?? 0}
									unit={item.unit_of_measure}
								/>
							</FormSection>
						</Box>

						{/* Right Column - Stock Movements */}
						<Box
							sx={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
								overflow: "hidden",
							}}
						>
							<Box
								sx={{
									flex: 1,
									minHeight: 0,
									p: 3,
									display: "flex",
									flexDirection: "column",
									overflowY: "scroll",
								}}
							>
								<FormSection title="Pohyby skladu" hideDivider>
									<Box
										sx={{
											height: "100%",
											display: "flex",
											flexDirection: "column",
											minHeight: 400,
										}}
									>
										<DataTable
											columns={movementColumns}
											data={movements}
											emptyMessage="Žádné pohyby skladu pro tuto položku."
											visibleColumnIds={
												new Set(movementColumns.map((c) => c.id))
											}
											getRowKey={(m) =>
												`${m.invoice_prefix}-${m.invoice_number}-${m.item_ean}`
											}
											getCellContent={getCellContent}
											contextMenuActions={contextMenuActions}
											onRowDoubleClick={handleRowDoubleClick}
											renderRow={(movement, visibleColumns) => (
												<>
													{visibleColumns.map((column) => (
														<TableCell
															key={column.id}
															align={column.align}
															style={{
																maxWidth: column.maxWidth,
																minWidth: column.minWidth,
																width: column.width,
															}}
														>
															{getCellContent(movement, column.id)}
														</TableCell>
													))}
												</>
											)}
										/>
									</Box>
								</FormSection>
							</Box>
						</Box>
					</Box>
				)}
			</Dialog>

			{viewingInvoice && (
				<ViewInvoiceDialog
					open={!!viewingInvoice}
					onClose={() => setViewingInvoice(null)}
					invoicePrefix={viewingInvoice.prefix}
					invoiceNumber={viewingInvoice.number}
				/>
			)}
		</>
	);
}