// filters/FilterAggregateFilter.tsx
import { Box, Button, TextField, IconButton, Divider } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CloseIcon from "@mui/icons-material/Close";
import type { FilterAggregateFilterDef, FilterDef } from "src/types/filter";
import type { ReactNode } from "react";
import { useRef, useState, useEffect } from "react";
import { DateField } from "../../inputs/DateField";

interface FilterAggregateFilterProps {
	filter: FilterAggregateFilterDef;
	value: {
		greaterThan?: string;
		equals?: string;
		lessThan?: string;
		comparator: ">" | "=" | "<";
	};
	onUpdate: (value: {
		greaterThan?: string;
		equals?: string;
		lessThan?: string;
		comparator: ">" | "=" | "<";
	}) => void;
	isExpanded: boolean;
	onToggleExpanded: () => void;
	isRemovable: boolean;
	onRemove?: () => void;
	renderExpandedFilter: (filter: FilterDef) => ReactNode;
}

// Internal component for rendering either TextField or DatePicker
function AggregateInput({
	isDateInput,
	value,
	onChange,
	label,
	placeholder,
	width,
	allowNegative,
	showBorder = true,
}: {
	isDateInput: boolean;
	value: string;
	onChange: (value: string) => void;
	label?: string;
	placeholder?: string;
	width?: number;
	allowNegative?: boolean;
	showBorder?: boolean;
}) {
if (isDateInput) {
		return (
			<DateField
				label={label}
				value={value}
				onChange={onChange}
				hideIcon
				hideBorder
				openOnFocus
				fullWidth={false}
				sx={{
					width: width || 130,
					height: 35,
				}}
			/>
		);
	}

	return (
		<TextField
			size="small"
			label={label}
			placeholder={placeholder || "0"}
			value={value}
			onChange={(e) => {
				const input = e.target.value;
				if (allowNegative) {
					if (input === "" || input === "-" || /^-?\d*$/.test(input)) {
						onChange(input);
					}
				} else {
					const numOnly = input.replace(/\D/g, "");
					onChange(numOnly);
				}
			}}
			sx={{
				width: width || 100,
				"& .MuiOutlinedInput-root": {
					"& fieldset": { border: showBorder ? undefined : "none" },
				},
				height: 35,
			}}
		/>
	);
}

export function FilterAggregateFilter({
	filter,
	value,
	onUpdate,
	isExpanded,
	onToggleExpanded,
	isRemovable,
	onRemove,
	renderExpandedFilter,
}: FilterAggregateFilterProps) {
	if (
		filter.primaryFilter.type !== "number-comparator" &&
		filter.primaryFilter.type !== "date-comparator"
	)
		return null;

	const currentValue = value || {
		comparator: ">",
		greaterThan: "",
		equals: "",
		lessThan: "",
	};
	const comparators: Array<">" | "=" | "<"> = [">", "=", "<"];
	const isDateInput = filter.primaryFilter.type === "date-comparator";

	const collapsedRef = useRef<HTMLDivElement>(null);
	const expandedRef = useRef<HTMLDivElement>(null);
	const [collapsedWidth, setCollapsedWidth] = useState<number | undefined>(
		undefined
	);

	// Measure collapsed width when not expanded
	useEffect(() => {
		if (!isExpanded && collapsedRef.current) {
			setCollapsedWidth(collapsedRef.current.offsetWidth);
		}
	}, [isExpanded]);

	// Handle click outside and Escape key to close
	useEffect(() => {
		if (!isExpanded) return;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			
			// Ignore clicks on DatePicker popper (calendar popup)
			if (target.closest('.MuiPopper-root') || target.closest('.MuiPickersPopper-root')) {
				return;
			}
			
			if (
				expandedRef.current &&
				!expandedRef.current.contains(target)
			) {
				onToggleExpanded();
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onToggleExpanded();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isExpanded, onToggleExpanded]);

	const getComparatorIcon = () => {
		if (currentValue.greaterThan && currentValue.greaterThan !== "") return ">";
		if (currentValue.equals && currentValue.equals !== "") return "=";
		if (currentValue.lessThan && currentValue.lessThan !== "") return "<";
		return currentValue.comparator;
	};

	const cycleComparator = () => {
		const next =
			currentValue.comparator === ">"
				? "="
				: currentValue.comparator === "="
					? "<"
					: ">";
		onUpdate({ ...currentValue, comparator: next });
	};

	const getCollapsedValue = () => {
		if (currentValue.greaterThan && currentValue.greaterThan !== "")
			return currentValue.greaterThan;
		if (currentValue.equals && currentValue.equals !== "")
			return currentValue.equals;
		if (currentValue.lessThan && currentValue.lessThan !== "")
			return currentValue.lessThan;
		switch (currentValue.comparator) {
			case ">":
				return currentValue.greaterThan || "";
			case "=":
				return currentValue.equals || "";
			case "<":
				return currentValue.lessThan || "";
		}
	};

	const updateCollapsedValue = (newValue: string) => {
		switch (currentValue.comparator) {
			case ">":
				onUpdate({ ...currentValue, greaterThan: newValue });
				break;
			case "=":
				onUpdate({ ...currentValue, equals: newValue });
				break;
			case "<":
				onUpdate({ ...currentValue, lessThan: newValue });
				break;
		}
	};

	return (
		<Box
			key={filter.id}
			sx={{
				position: "relative",
				display: "inline-block",
				backgroundColor: "background.paper",
			}}
		>
			{/* Collapsed view */}
			<Box
				ref={collapsedRef}
				sx={{
					display: "inline-flex",
					border: (theme) => `1px solid ${theme.palette.divider}`,
					borderRadius: 1,
					bgcolor: "background.default",
					visibility: isExpanded ? "hidden" : "visible",
				}}
			>
				<Button
					onClick={cycleComparator}
					size="small"
					variant="text"
					sx={{
						minWidth: 40,
						height: 35,
						borderTopRightRadius: 0,
						borderBottomRightRadius: 0,
						fontSize: "1rem",
						fontWeight: "bold",
						px: 1,
						borderRight: (theme) => `1px solid ${theme.palette.divider}`,
					}}
				>
					{getComparatorIcon()}
				</Button>

				<AggregateInput
					isDateInput={isDateInput}
					value={getCollapsedValue()}
					onChange={updateCollapsedValue}
					label={filter.primaryFilter.label}
					placeholder={filter.primaryFilter.placeholder}
					width={filter.primaryFilter.width}
					allowNegative={filter.primaryFilter.allowNegative}
					showBorder={false}
				/>

				<Box sx={{ display: "flex" }}>
					{filter.collapsible && (
						<IconButton
							size="small"
							onClick={onToggleExpanded}
							sx={{
								height: 35,
								borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
								borderRadius: 0,
							}}
						>
							<AddIcon fontSize="small" />
						</IconButton>
					)}
					{isRemovable && onRemove && (
						<IconButton
							size="small"
							onClick={onRemove}
							sx={{
								height: 35,
								borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
								borderRadius: 0,
							}}
							title="Odstranit filtr"
						>
							<CloseIcon fontSize="small" />
						</IconButton>
					)}
				</Box>
			</Box>

			{/* Expanded view */}
			{isExpanded && (
				<Box
					ref={expandedRef}
					sx={{
						position: "absolute",
						top: 0,
						left: 0,
						display: "inline-flex",
						flexDirection: "column",
						border: (theme) => `1px solid ${theme.palette.divider}`,
						borderRadius: 1,
						bgcolor: "background.default",
						zIndex: 1000,
						boxShadow: 2,
					}}
				>
					{comparators.map((comp, idx) => {
						const displayValue =
							comp === ">"
								? currentValue.greaterThan || ""
								: comp === "="
									? currentValue.equals || ""
									: currentValue.lessThan || "";

						return (
							<Box
								key={comp}
								sx={{
									display: "flex",
									borderBottom:
										idx < comparators.length - 1
											? (theme) => `1px solid ${theme.palette.divider}`
											: "none",
								}}
							>
								<Box
									sx={{
										minWidth: 40,
										height: 35,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										borderRight: (theme) => `1px solid ${theme.palette.divider}`,
										fontSize: "1rem",
										fontWeight: "bold",
										color: "text.disabled",
									}}
								>
									{comp}
								</Box>

								<AggregateInput
									isDateInput={isDateInput}
									value={displayValue}
									onChange={(newValue) => {
										if (comp === ">") {
											onUpdate({ ...currentValue, greaterThan: newValue });
										} else if (comp === "=") {
											onUpdate({ ...currentValue, equals: newValue });
										} else {
											onUpdate({ ...currentValue, lessThan: newValue });
										}
									}}
									label={idx === 0 ? filter.primaryFilter.label : undefined}
									placeholder={filter.primaryFilter.placeholder}
									width={filter.primaryFilter.width}
									allowNegative={filter.primaryFilter.allowNegative}
									showBorder={false}
								/>

								{idx === 0 && (
									<Box sx={{ display: "flex" }}>
										{filter.collapsible && (
											<IconButton
												size="small"
												onClick={onToggleExpanded}
												sx={{
													height: 35,
													borderLeft: (theme) =>
														`1px solid ${theme.palette.divider}`,
													borderRadius: 0,
												}}
											>
												<RemoveIcon fontSize="small" />
											</IconButton>
										)}
										{isRemovable && onRemove && (
											<IconButton
												size="small"
												onClick={onRemove}
												sx={{
													height: 35,
													borderLeft: (theme) =>
														`1px solid ${theme.palette.divider}`,
													borderRadius: 0,
												}}
												title="Odstranit filtr"
											>
												<CloseIcon fontSize="small" />
											</IconButton>
										)}
									</Box>
								)}
							</Box>
						);
					})}

					{filter.expandedFilters.length > 0 && (
						<>
							<Divider sx={{ borderColor: "divider" }} />
							<Box
								sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1 }}
							>
								{filter.expandedFilters.map((subFilter) =>
									renderExpandedFilter(subFilter)
								)}
							</Box>
						</>
					)}
				</Box>
			)}
		</Box>
	);
}