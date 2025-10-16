import React from "react";
import { Box, Typography, Divider } from "@mui/material";

interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
  spacing?: number;
}

export function FormSection({
  title,
  children,
  spacing = 2,
}: FormSectionProps) {
  return (
    <Box>
      {title && (
        <>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: "text.secondary",
              mb: 1.5,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: "0.75rem",
            }}
          >
            {title}
          </Typography>
        </>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: spacing }}>
        {children}
      </Box>
      {title && <Divider sx={{ mt: 2.5, mb: 0.5 }} />}
    </Box>
  );
}
