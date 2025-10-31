import { useState } from "react";
import {
	Button,
	FormGroup,
	FormControlLabel,
	Box,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	ToggleButtonGroup,
	ToggleButton,
	Divider,
	Typography,
} from "@mui/material";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import type { Column } from "../table/DataTable";
import { KeyboardCheckbox } from "../inputs/KeyboardCheckbox";
import { Dialog } from "../dialog/Dialog";

export type SortOrder = "asc" | "desc";

export interface OrderByConfig {
	columnId: string | null;
	order: SortOrder;
}

interface ColumnSelectorButtonProps {
	columns: Column[];
	visibleColumnIds: Set<string>;
	onVisibleColumnsChange: (columnIds: Set<string>) => void;
	defaultColumnIds?: string[];
	orderBy?: OrderByConfig;
	onOrderByChange?: (orderBy: OrderByConfig) => void;
}

export function ColumnSelectorButton({
	columns,
	visibleColumnIds,
	onVisibleColumnsChange,
	defaultColumnIds = [],
	orderBy,
	onOrderByChange,
}: ColumnSelectorButtonProps) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [tempOrderBy, setTempOrderBy] = useState<OrderByConfig>(
		orderBy || { columnId: null, order: "asc" },
	);

	const handleToggleColumn = (columnId: string) => {
		const next = new Set(visibleColumnIds);
		next.has(columnId) ? next.delete(columnId) : next.add(columnId);
		onVisibleColumnsChange(next);
	};

	const handleSelectAll = () => {
		onVisibleColumnsChange(new Set(columns.map((c) => c.id)));
	};

	const handleResetToDefault = () => {
		onVisibleColumnsChange(new Set(defaultColumnIds));
	};

	const handleOrderColumnChange = (columnId: string) => {
		setTempOrderBy((prev) => ({
			...prev,
			columnId: columnId || null,
		}));
	};

	const handleOrderDirectionChange = (order: SortOrder) => {
		setTempOrderBy((prev) => ({
			...prev,
			order,
		}));
	};

	const handleClose = () => {
		if (onOrderByChange) {
			onOrderByChange(tempOrderBy);
		}
		setDialogOpen(false);
	};

	const handleOpen = () => {
		setTempOrderBy(orderBy || { columnId: null, order: "asc" });
		setDialogOpen(true);
	};

	return (
		<>
			<Button
				onClick={handleOpen}
				variant="outlined"
				size="large"
				title="Vybrat sloupce"
				sx={{ minWidth: "auto", px: 1 }}
			>
				<ViewColumnIcon />
			</Button>

			<Dialog
				open={dialogOpen}
				onClose={handleClose}
				title="Vybrat sloupce"
				maxWidth="xs"
				actions={[
					{
						label: 'Vybrat všechny',
						onClick: handleSelectAll,
						variant: "outlined",
					},
					{
						label: 'Obnovit výchozí',
						onClick: handleResetToDefault,
						variant: "outlined",
						icon: <RestartAltIcon />,
					},
					{
						label: "Zavřít",
						onClick: handleClose,
						variant: "contained",
					},
				]}
			>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
					{/* Column Visibility Section */}
					<Box>
						<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
							Viditelné sloupce
						</Typography>
						<FormGroup>
							{columns.map((column) => (
								<FormControlLabel
									key={column.id}
									control={
										<KeyboardCheckbox
											size="small"
											checked={visibleColumnIds.has(column.id)}
											onChange={() => handleToggleColumn(column.id)}
										/>
									}
									label={column.label}
								/>
							))}
						</FormGroup>
					</Box>

					{/* Order By Section */}
					{onOrderByChange && (
						<>
							<Divider />
							<Box>
								<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
									Řadit podle
								</Typography>
								<FormControl fullWidth size="small" sx={{ mb: 2 }}>
									<InputLabel>Sloupec</InputLabel>
									<Select
										value={tempOrderBy.columnId || ""}
										onChange={(e) => handleOrderColumnChange(e.target.value)}
										label="Sloupec"
									>
										<MenuItem value="">
											<em>Bez řazení</em>
										</MenuItem>
										{columns.map((column) => (
											<MenuItem key={column.id} value={column.id}>
												{column.label}
											</MenuItem>
										))}
									</Select>
								</FormControl>

								<Box>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ mb: 0.5, display: "block" }}
									>
										Směr řazení
									</Typography>
									<ToggleButtonGroup
										value={tempOrderBy.order}
										exclusive
										onChange={(_, value) => {
											if (value) handleOrderDirectionChange(value);
										}}
										fullWidth
										size="small"
										disabled={!tempOrderBy.columnId}
									>
										<ToggleButton value="asc">
											<ArrowUpwardIcon sx={{ mr: 0.5, fontSize: 18 }} />
											Vzestupně
										</ToggleButton>
										<ToggleButton value="desc">
											<ArrowDownwardIcon sx={{ mr: 0.5, fontSize: 18 }} />
											Sestupně
										</ToggleButton>
									</ToggleButtonGroup>
								</Box>
							</Box>
						</>
					)}
				</Box>
			</Dialog>
		</>
	);
}