import React from "react";
import { TextField, TextFieldProps } from "@mui/material";

interface FormTextFieldProps
  extends Omit<TextFieldProps, "error" | "helperText"> {
  error?: string;
  grayWhenEmpty?: boolean;
  grayWhenZero?: boolean;
}

export function FormTextField({
  error,
  grayWhenEmpty,
  grayWhenZero,
  value,
  InputProps,
  ...props
}: FormTextFieldProps) {
  const shouldGray =
    (grayWhenEmpty && (!value || value === "")) ||
    (grayWhenZero && (value === 0 || value === "0"));

  return (
    <TextField
      value={value}
      error={!!error}
      helperText={error}
      InputProps={{
        ...InputProps,
        style: {
          ...InputProps?.style,
          color: shouldGray ? "#999" : undefined,
        },
      }}
      {...props}
    />
  );
}
