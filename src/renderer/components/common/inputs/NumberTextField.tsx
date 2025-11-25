import React, { useState, useEffect } from "react";
import { FormTextField } from "../form/FormTextField";
import type { TextFieldProps } from "@mui/material";
import {
	formatNumber,
	parseNumericInput,
	clampNumber,
} from "../../../../utils/formattingUtils";

interface NumberTextFieldProps
	extends Omit<TextFieldProps, "type" | "value" | "onChange"> {
	name: string;
	value: number | string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	precision?: number;
	allowNegative?: boolean;
	min?: number;
	max?: number;
	grayWhenZero?: boolean;
}

export function NumberTextField({
	name,
	value,
	onChange,
	error,
	precision = 2,
	allowNegative = false,
	min,
	max,
	grayWhenZero,
	...props
}: NumberTextFieldProps) {
	const [displayValue, setDisplayValue] = useState<string>("");
	const [isFocused, setIsFocused] = useState(false);

	useEffect(() => {
		if (!isFocused) {
			setDisplayValue(formatNumber(value, precision));
		}
	}, [value, isFocused, precision]);

	const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		setIsFocused(true);
		e.target.select();
	};

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		setIsFocused(false);

		// Convert Czech comma format to dot format
		const normalizedValue = displayValue.replace(',', '.');
		let numValue = parseFloat(normalizedValue);

		if (isNaN(numValue)) {
			numValue = 0;
		}

		numValue = clampNumber(numValue, min, max);

		const formatted = formatNumber(numValue, precision);
		setDisplayValue(formatted);

		const syntheticEvent = {
			...e,
			target: {
				...e.target,
				name,
				value: numValue.toString(),
			},
		} as React.ChangeEvent<HTMLInputElement>;

		onChange(syntheticEvent);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = parseNumericInput(e.target.value, {
			allowNegative,
			precision,
		});

		setDisplayValue(inputValue);

		const syntheticEvent = {
			...e,
			target: {
				...e.target,
				name,
				value: inputValue,
			},
		} as React.ChangeEvent<HTMLInputElement>;

		onChange(syntheticEvent);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if ([8, 9, 27, 13, 46].includes(e.keyCode)) {
			return;
		}

		if (
			(e.keyCode === 65 ||
				e.keyCode === 67 ||
				e.keyCode === 86 ||
				e.keyCode === 88) &&
			(e.ctrlKey || e.metaKey)
		) {
			return;
		}

		if (e.keyCode >= 35 && e.keyCode <= 40) {
			return;
		}

		const key = e.key;
		const isNumber = /^[0-9]$/.test(key);
		const isDecimal =
			(key === "." || key === ",") &&
			precision > 0 &&
			!displayValue.includes(".") &&
			!displayValue.includes(",");
		const isMinus = key === "-" && allowNegative && displayValue.length === 0;

		if (!isNumber && !isDecimal && !isMinus) {
			e.preventDefault();
		}
	};

	return (
		<FormTextField
			{...props}
			name={name}
			value={displayValue}
			onChange={handleChange}
			onFocus={handleFocus}
			onBlur={handleBlur}
			onKeyDown={handleKeyDown}
			grayWhenZero={grayWhenZero}
			inputProps={{
				...props.inputProps,
				inputMode: "decimal",
			}}
		/>
	);
}
