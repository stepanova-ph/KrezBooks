import { Box, Button, TextField } from "@mui/material";
import type { NumberComparatorFilterDef } from "src/types/filter";

interface NumberComparatorFilterProps {
	filter: NumberComparatorFilterDef;
	value: { value: string; comparator: ">" | "=" | "<" };
	onUpdate: (value: { value: string; comparator: ">" | "=" | "<" }) => void;
	locked?: boolean;
}

export function NumberComparatorFilter({
	filter,
	value,
	onUpdate,
	locked = false,
}: NumberComparatorFilterProps) {
	const currentValue = value || { value: "", comparator: ">" };

	const getComparatorIcon = () => {
		switch (currentValue.comparator) {
			case ">":
				return ">";
			case "=":
				return "=";
			case "<":
				return "<";
		}
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

	return (
		<Box
			key={filter.id}
			sx={{ display: "flex", gap: 0, alignItems: "flex-start" }}
		>
			{locked ? (
				<Box
					sx={{
						minWidth: 40,
						height: 37,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						border: (theme) => `1px solid ${theme.palette.grey[400]}`,
						borderTopRightRadius: 0,
						borderBottomRightRadius: 0,
						borderRight: "none",
						fontSize: "1rem",
						fontWeight: "bold",
						bgcolor: "action.disabledBackground",
						color: "text.disabled",
					}}
				>
					{getComparatorIcon()}
				</Box>
			) : (
				<Button
					onClick={cycleComparator}
					size="small"
					variant="outlined"
					sx={{
						minWidth: 40,
						height: 37,
						borderColor: (theme) => theme.palette.grey[400],
						borderTopRightRadius: 0,
						borderBottomRightRadius: 0,
						borderRight: "none",
						fontSize: "1rem",
						fontWeight: "bold",
						px: 1,
					}}
				>
					{getComparatorIcon()}
				</Button>
			)}
			<TextField
				size="small"
				label={filter.label}
				placeholder={filter.placeholder || "0"}
				value={currentValue.value}
				onChange={(e) => {
					const input = e.target.value;
					if (filter.allowNegative) {
						if (input === "" || input === "-" || /^-?\d*$/.test(input)) {
							onUpdate({ ...currentValue, value: input });
						}
					} else {
						const numOnly = input.replace(/\D/g, "");
						onUpdate({ ...currentValue, value: numOnly });
					}
				}}
				sx={{
					width: filter.width || 100,
					"& .MuiOutlinedInput-root": {
						borderTopLeftRadius: 0,
						borderBottomLeftRadius: 0,
					},
				}}
			/>
		</Box>
	);
}
