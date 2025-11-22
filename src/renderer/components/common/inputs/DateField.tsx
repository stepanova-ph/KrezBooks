import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { InputAdornment, SxProps, Theme, Tooltip } from "@mui/material";
import { useState, useRef } from "react";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface DateFieldProps {
	label?: string;
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	error?: string | boolean;
	required?: boolean;
	disabled?: boolean;
	fullWidth?: boolean;
	size?: "small" | "medium";
	sx?: SxProps<Theme>;
	hideBorder?: boolean;
	hideIcon?: boolean;
	openOnFocus?: boolean;
	showErrorIcon?: boolean;
	showErrorTooltip?: boolean;
}

export function DateField({
	label,
	value,
	onChange,
	onBlur,
	error,
	required,
	disabled,
	fullWidth = true,
	size = "small",
	sx,
	hideBorder = false,
	hideIcon = false,
	openOnFocus = false,
	showErrorIcon = false,
	showErrorTooltip = true,
}: DateFieldProps) {
	const [open, setOpen] = useState(false);
	const shouldOpenOnFocus = useRef(true);

	const handleChange = (date: Dayjs | null) => {
		const newValue = date?.format("YYYY-MM-DD") || "";
		onChange(newValue);
	};

	const handleClose = () => {
		setOpen(false);
		shouldOpenOnFocus.current = false;
		setTimeout(() => {
			shouldOpenOnFocus.current = true;
		}, 200);
		onBlur?.();
	};

	const handleFocus = () => {
		if (openOnFocus && shouldOpenOnFocus.current) {
			setOpen(true);
		}
	};

	const hasError = typeof error === "string" ? !!error : !!error;
	const errorMessage = typeof error === "string" ? error : undefined;

	const textFieldSx: SxProps<Theme> = {
		...(hideBorder && {
			"& .MuiPickersOutlinedInput-root": {
				"& fieldset": { border: "none" },
				"&.Mui-focused fieldset": { border: "none" },
			},
		}),
		...(typeof sx === "object" && sx !== null ? sx : {}),
	};

	// Only control open state if openOnFocus is true
	const openProps = openOnFocus
		? {
				open,
				onOpen: () => setOpen(true),
				onClose: handleClose,
			}
		: {};

	// Build InputProps with optional error icon
	const inputProps =
		showErrorIcon && hasError
			? {
					endAdornment: (
						<InputAdornment position="end">
							{showErrorTooltip && errorMessage ? (
								<Tooltip title={errorMessage} arrow placement="top">
									<ErrorOutlineIcon
										sx={{ color: "error.main", fontSize: 20, cursor: "help" }}
									/>
								</Tooltip>
							) : (
								<ErrorOutlineIcon sx={{ color: "error.main", fontSize: 20 }} />
							)}
						</InputAdornment>
					),
				}
			: undefined;

	return (
		<DatePicker
			label={label}
			value={value ? dayjs(value) : null}
			onChange={handleChange}
			disabled={disabled}
			format="DD. MM. YYYY"
			{...openProps}
			slotProps={{
				textField: {
					variant: "outlined",
					size,
					fullWidth,
					required,
					error: hasError,
					helperText: showErrorIcon ? undefined : errorMessage,
					onFocus: openOnFocus ? handleFocus : undefined,
					onBlur: openOnFocus ? undefined : onBlur,
					sx: textFieldSx,
					InputProps: inputProps,
				},

				openPickerButton: hideIcon ? { sx: { display: "none" } } : undefined,
				popper: {
					sx: {
						"& .MuiDateCalendar-root": {
							width: 220,
							height: 190,
						},
						"& .MuiPaper-root": {
							boxShadow: 2,
						},
						"& .MuiPickersCalendarHeader-root": {
							paddingLeft: 1,
							paddingRight: 1,
							marginTop: 0.5,
							marginBottom: 0,
							minHeight: 28,
						},
						"& .MuiPickersCalendarHeader-label": {
							fontSize: "0.8rem",
						},
						"& .MuiDayCalendar-header": {
							gap: 0,
						},
						"& .MuiDayCalendar-weekDayLabel": {
							width: 26,
							height: 26,
							fontSize: "0.7rem",
						},
						"& .MuiDayCalendar-slideTransition": {
							minHeight: 165,
						},
						"& .MuiPickersDay-root": {
							width: 26,
							height: 26,
							fontSize: "0.75rem",
						},
						"& .MuiDayCalendar-weekContainer": {
							gap: 0,
							margin: 0,
						},
						"& .MuiPickersArrowSwitcher-button": {
							padding: 0.25,
						},
						"& .MuiPickersCalendarHeader-switchViewButton": {
							padding: 0.25,
						},
					},
				},
			}}
		/>
	);
}