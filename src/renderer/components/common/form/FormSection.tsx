import React from "react";
import { Box, Typography, Divider } from "@mui/material";

interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
  spacing?: number;
  actions?: React.ReactNode;
  hideDivider?: boolean;
  direction?: "row" | "column"
  mb?: number;
  my?: number;
}

export function FormSection({
  title,
  children,
  spacing = 2,
  actions,
  hideDivider = false,
  direction = "column",
  my = undefined,
}: FormSectionProps) {
  const showHeader = !!title || !!actions;

  return (
    <Box px={4}>
      <Box >
        {showHeader && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              my: my,
              mb: 1.5,
              minWidth: 0,
              flexWrap: "wrap",
            }}
          >
            {title && (
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: "0.2px",
                  fontSize: "0.75rem",
                }}
              >
                {title}
              </Typography>
            )}
            {actions && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {actions}
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: direction, gap: spacing, mx: -2 }}>
          {children}
        </Box>
      </Box>

      {showHeader && !hideDivider && <Divider sx={{ mt: 2.5, mb: 0.5 }} />}
    </Box>
  );
}
