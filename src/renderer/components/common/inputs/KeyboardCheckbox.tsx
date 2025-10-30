// src/renderer/components/common/KeyboardCheckbox.tsx
import { Checkbox, CheckboxProps } from "@mui/material";
import { useRef } from "react";

interface KeyboardCheckboxProps extends CheckboxProps {
	// all standard checkbox props supported
}

export function KeyboardCheckbox({
	checked,
	onChange,
	...props
}: KeyboardCheckboxProps) {
	const checkboxRef = useRef<HTMLButtonElement>(null);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			e.stopPropagation(); // prevent datatable Enter action

			// trigger the change
			if (onChange) {
				onChange({ target: { checked: !checked } } as any, !checked);
			}
		}
	};

	return (
		<Checkbox
			ref={checkboxRef}
			checked={checked}
			onChange={onChange}
			onKeyDown={handleKeyDown}
			{...props}
		/>
	);
}
