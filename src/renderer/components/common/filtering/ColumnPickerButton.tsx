import { useEffect, useState } from "react";
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

export function ColumnPickerButton({
	columns,
	visibleColumnIds,
	onVisibleColumnsChange,
	defaultColumnIds = [],
	orderBy,
	onOrderByChange,
}: ColumnSelectorButtonProps) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [localOrderBy, setLocalOrderBy] = useState<OrderByConfig>(
		orderBy || { columnId: null, order: "asc" },
	);

	useEffect(() => {
		if (orderBy) setLocalOrderBy(orderBy);
	}, [orderBy?.columnId, orderBy?.order]);

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
		onOrderByChange?.({ columnId: null, order: "asc" });
	};

	const applyOrderColumn = (columnId?: string) => {
		const next: OrderByConfig = {
			columnId: columnId && columnId !== "" ? columnId : null,
			order: localOrderBy?.order ?? "asc",
		};
		setLocalOrderBy(next);
		onOrderByChange?.(next);
	};

	const applyOrderDirection = (_: unknown, dir: SortOrder | null) => {
		if (!dir) return;
		const next: OrderByConfig = {
			columnId: localOrderBy?.columnId ?? null,
			order: dir,
		};
		setLocalOrderBy(next);
		onOrderByChange?.(next);
	};

	const handleClose = () => setDialogOpen(false);
	const handleOpen = () => {
		setLocalOrderBy(orderBy || { columnId: null, order: "asc" });
		setDialogOpen(true);
	};

	return (
		<>
			{/* {orderBy && */}
			<Button
				onClick={handleOpen}
				variant="outlined"
				size="large"
				title="Vybrat sloupce"
				sx={{ minWidth: "auto", px: 1 }}
			>
				<ViewColumnIcon />
			</Button>
			{/* } */}
			<Dialog
				open={dialogOpen}
				onClose={handleClose}
				title="Vybrat sloupce"
				maxWidth="xs"
				actions={[
					{
						label: "Vybrat všechny",
						onClick: handleSelectAll,
						variant: "outlined",
					},
					{
						label: "Obnovit výchozí",
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

					{onOrderByChange && (
						<>
							<Divider />
							<Box>
								<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
									Řazení
								</Typography>

								<FormControl fullWidth size="small" sx={{ mb: 2 }}>
									<InputLabel>Řadit podle</InputLabel>
									<Select
										label="Řadit podle"
										value={localOrderBy?.columnId ?? ""}
										onChange={(e) => applyOrderColumn(String(e.target.value))}
									>
										<MenuItem value="">
											<em>Bez řazení</em>
										</MenuItem>
										{columns.map((col) => (
											<MenuItem key={col.id} value={col.id}>
												{col.label ?? col.id}
											</MenuItem>
										))}
									</Select>
								</FormControl>

								<ToggleButtonGroup
									fullWidth
									size="small"
									exclusive
									value={localOrderBy?.order ?? "asc"}
									onChange={applyOrderDirection}
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
						</>
					)}
				</Box>
			</Dialog>
		</>
	);
}

export default ColumnPickerButton;
