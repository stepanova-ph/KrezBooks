import { InputAdornment, Tooltip } from "@mui/material";
import { FormTextField } from "./FormTextField";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const ValidatedTextField = ({ error, showToolTip = true, ...props }: any) => {
  const hasError = !!error;

  return (
    <FormTextField
      {...props}
      error={hasError}
      InputProps={{
        ...props.InputProps,
        endAdornment: (
          <>
            {hasError && (
              <InputAdornment position="end">
                {!!showToolTip ? (
                  <Tooltip title={error} arrow placement="top">
                    <ErrorOutlineIcon
                      sx={{ color: "error.main", fontSize: 20, cursor: "help" }}
                    />
                  </Tooltip>
                ) : (
                  <ErrorOutlineIcon
                    sx={{ color: "error.main", fontSize: 20 }}
                  />
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
