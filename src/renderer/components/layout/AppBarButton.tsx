import { Button, ButtonProps, useTheme } from "@mui/material";
import { useState } from "react";

interface AppBarButtonProps extends Omit<ButtonProps, "variant" | "color"> {
  active?: boolean;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function AppBarButton({
  active = false,
  label,
  disabled = false,
  onClick,
  ...props
}: AppBarButtonProps) {
  const theme = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
      onClick?.();
    }
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      disabled={disabled}
      disableRipple // Disable default ripple
        tabIndex={-1}
      sx={{
        minWidth: 100,
        height: 32,
        padding: "4px 16px",
        fontSize: "0.8125rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderRadius: 0,
        border: "none",
        backgroundColor: active
          ? theme.palette.background.paper
          : "transparent",
        color: active ? theme.palette.primary.main : theme.palette.common.white,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        marginRight: "2px",
        position: "relative",
        overflow: "hidden",

        // Hover state
        "&:hover:not(:disabled)": {
          backgroundColor: active
            ? theme.palette.background.paper
            : `rgba(255, 255, 255, 0.1)`,
          transform: "translateY(-2px)",
          boxShadow: active
            ? `0 4px 8px ${theme.palette.primary.main}33`
            : `0 4px 8px rgba(0, 0, 0, 0.4)`,

          "&::before": {
            transform: "scaleX(1)",
          },
        },

        // Hover underline animation
        "&::before": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: active
            ? theme.palette.primary.light
            : theme.palette.primary.light,
          transform: "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 2,
        },

        "&::after": {
          content: '""',
          position: "absolute",
          bottom: active ? 0 : "-100%",
          left: 0,
          right: 0,
          height: active ? 2 : "100%",
          backgroundColor: active
            ? theme.palette.primary.light
            : `${theme.palette.primary.main}40`,
          transition: active ? "height 0.3s ease" : "none",
          zIndex: 0,
          ...(isAnimating && {
            animation: "waveUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }),
        },

        "& .MuiButton-label, & > *": {
          position: "relative",
          zIndex: 1,
        },

        "&:disabled": {
          color: theme.palette.common.white,
          opacity: 0.5,
          transform: "none",
        },

        "@keyframes waveUp": {
          "0%": {
            bottom: "-100%",
            height: "0%",
            opacity: 0.4,
          },
          "50%": {
            bottom: 0,
            height: "100%",
            opacity: 0.4,
          },
          "100%": {
            bottom: 0,
            height: "100%",
            opacity: 0,
          },
        },

        ...props.sx,
      }}
    >
      {label}
    </Button>
  );
}
