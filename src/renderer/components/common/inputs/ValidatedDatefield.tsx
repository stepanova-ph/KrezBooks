import { DateField } from "./DateField";
import type { SxProps, Theme } from "@mui/material";

interface ValidatedDateFieldProps {
	label?: string;
	name?: string;
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	error?: string | boolean;
	required?: boolean;
	disabled?: boolean;
	fullWidth?: boolean;
	size?: "small" | "medium";
	sx?: SxProps<Theme>;
	showToolTip?: boolean;
}

export function ValidatedDateField({
	showToolTip = true,
	...props
}: ValidatedDateFieldProps) {
	return (
		<DateField
			{...props}
			hideIcon
			showErrorIcon
			showErrorTooltip={showToolTip}
            openOnFocus
		/>
	);
}

export default ValidatedDateField;