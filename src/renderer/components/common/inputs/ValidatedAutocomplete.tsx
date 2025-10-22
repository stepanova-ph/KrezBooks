import { Autocomplete, AutocompleteProps } from "@mui/material";
import ValidatedTextField from "./ValidatedTextField";
import type { FormTextFieldProps } from "../form/FormTextField";

type ErrorLike = string | boolean | undefined;

type BaseProps<T, Multiple extends boolean, DisableClearable extends boolean, FreeSolo extends boolean> =
  Omit<AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>, "renderInput"> & {
    label?: FormTextFieldProps["label"];
    name?: string;
    error?: ErrorLike;
    helperText?: FormTextFieldProps["helperText"];
    onBlur?: FormTextFieldProps["onBlur"];
    required?: boolean;
    showToolTip?: boolean;
    textFieldProps?: Omit<FormTextFieldProps, "error" | "label" | "name" | "helperText" | "onBlur" | "required">;
  };

export function ValidatedAutocomplete<
  T,
  Multiple extends boolean = false,
  DisableClearable extends boolean = false,
  FreeSolo extends boolean = false
>({
  label,
  name,
  error,
  helperText,
  onBlur,
  required,
  showToolTip = true,
  textFieldProps,
  ...autoProps
}: BaseProps<T, Multiple, DisableClearable, FreeSolo>) {
  return (
    <Autocomplete<T, Multiple, DisableClearable, FreeSolo>
      {...(autoProps as any)}
      renderInput={(params) => (
        <ValidatedTextField
          {...params}
          {...textFieldProps}
          label={label}
          name={name}
          error={error}
          helperText={helperText}
          onBlur={onBlur}
          required={required}
          showToolTip={showToolTip}
          inputProps={{ ...params.inputProps, autoComplete: "off" }}
          InputProps={{ ...params.InputProps }}
          fullWidth
        />
      )}
    />
  );
}
