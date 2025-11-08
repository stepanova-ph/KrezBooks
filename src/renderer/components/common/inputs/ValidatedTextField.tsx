import { InputAdornment, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { FormTextField } from "../form/FormTextField";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const disabledValidatedTextfieldSx = (theme) => ({
  "& .MuiInputBase-input.Mui-disabled": {
    color: alpha(theme.palette.text.primary, 0.6),
    WebkitTextFillColor: alpha(theme.palette.text.primary, 0.6),
  },
  "& .MuiFormLabel-root.Mui-disabled": {
    color: alpha(theme.palette.text.primary, 0.6),
    WebkitTextFillColor: alpha(theme.palette.text.primary, 0.6),
  },
});

const ValidatedTextField = ({
  error,
  showToolTip = true,
  disabled,
  sx,
  ...props
}: any) => {
  const hasError = !!error;

  return (
    <FormTextField
      {...props}
      disabled={disabled}
      error={hasError}
      sx={(theme) => ({
        ...(typeof sx === "function" ? sx(theme) : sx), // preserve any sx from props
        ...(disabled ? disabledValidatedTextfieldSx(theme) : {}), // apply if disabled
      })}
      InputProps={{
        ...props.InputProps,
        endAdornment: (
          <>
            {hasError && (
              <InputAdornment position="end">
                {showToolTip ? (
                  <Tooltip title={error} arrow placement="top">
                    <ErrorOutlineIcon
                      sx={{ color: "error.main", fontSize: 20, cursor: "help" }}
                    />
                  </Tooltip>
                ) : (
                  <ErrorOutlineIcon sx={{ color: "error.main", fontSize: 20 }} />
                )}
              </InputAdornment>
            )}
            {props.InputProps?.endAdornment}
          </>
        ),
      }}
    />
  );
};

export default ValidatedTextField;
