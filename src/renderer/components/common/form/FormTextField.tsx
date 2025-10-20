import { TextField, TextFieldProps } from '@mui/material';
import { forwardRef } from 'react';

export interface FormTextFieldProps extends Omit<TextFieldProps, 'error'> {
  error?: string | boolean;
}

/**
 * FormTextField component - wrapper around MUI TextField
 * Accepts error as string (message) or boolean and converts it properly
 */
export const FormTextField = forwardRef<HTMLDivElement, FormTextFieldProps>(
  ({ error, helperText, ...props }, ref) => {
    const hasError = typeof error === 'string' ? !!error : !!error;
    const errorMessage = typeof error === 'string' ? error : undefined;
    
    return (
      <TextField
        ref={ref}
        {...props}
        error={hasError}
        helperText={errorMessage || helperText}
        fullWidth
      />
    );
  }
);

FormTextField.displayName = 'FormTextField';