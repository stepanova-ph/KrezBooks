import React from "react";
import { alpha, Box, Typography, useTheme } from "@mui/material";

interface LoadingProps {
	text?: string;
	size?: "small" | "medium" | "large";
	fullScreen?: boolean;
}

export function Loading({
	text = "Načítání...",
	size = "medium",
	fullScreen = false,
}: LoadingProps) {
	const theme = useTheme();

	const sizeConfig = {
		small: {
			width: 85,
			height: 40,
			squareSize: 25,
			cornerOffset: 3,
			overlapOffset: 22,
			textSize: "0.75rem",
		},
		medium: {
			width: 136,
			height: 60,
			squareSize: 40,
			cornerOffset: 5,
			overlapOffset: 35,
			textSize: "0.875rem",
		},
		large: {
			width: 176,
			height: 80,
			squareSize: 52,
			cornerOffset: 6,
			overlapOffset: 46,
			textSize: "1rem",
		},
	};

	const config = sizeConfig[size];

	const containerStyles = fullScreen
		? {
				position: "fixed" as const,
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				display: "flex",
				flexDirection: "column" as const,
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "rgba(0, 0, 0, 0.5)",
				zIndex: 9999,
			}
		: {
				display: "flex",
				flexDirection: "column" as const,
				alignItems: "center",
				justifyContent: "center",
				padding: 3,
			};

	return (
		<Box sx={containerStyles}>
			<Box
				sx={{
					width: config.width,
					height: config.height,
					background: `
            conic-gradient(from 90deg at ${config.cornerOffset}px ${config.cornerOffset}px, transparent 90deg, ${theme.palette.primary.main} 0),
            conic-gradient(from 90deg at ${config.cornerOffset}px ${config.cornerOffset}px, transparent 90deg, ${theme.palette.primary.main} 0),
            conic-gradient(from 90deg at ${config.cornerOffset}px ${config.cornerOffset}px, transparent 90deg, ${theme.palette.primary.main} 0),
            conic-gradient(from -90deg at ${config.overlapOffset}px ${config.overlapOffset}px, transparent 90deg, ${theme.palette.secondary.light} 0),
            conic-gradient(from -90deg at ${config.overlapOffset}px ${config.overlapOffset}px, transparent 90deg, ${theme.palette.secondary.light} 0),
            conic-gradient(from -90deg at ${config.overlapOffset}px ${config.overlapOffset}px, transparent 90deg, ${theme.palette.secondary.light} 0)
          `,
					backgroundSize: `${config.squareSize}px ${config.squareSize}px`,
					backgroundRepeat: "no-repeat",
					animation: "loaderAnimation 1s infinite alternate",
					"@keyframes loaderAnimation": {
						"0%": {
							backgroundPosition: "0 50%, 50% 50%, 100% 50%",
						},
						"20%": {
							backgroundPosition: "0 0, 50% 50%, 100% 50%",
						},
						"40%": {
							backgroundPosition: "0 100%, 50% 0, 100% 50%",
						},
						"60%": {
							backgroundPosition: "0 50%, 50% 100%, 100% 0",
						},
						"80%": {
							backgroundPosition: "0 50%, 50% 50%, 100% 100%",
						},
						"100%": {
							backgroundPosition: "0 50%, 50% 50%, 100% 50%",
						},
					},
				}}
			/>
			{text && (
				<Typography
					variant="body2"
					sx={{
						mt: 2,
						color: fullScreen
							? theme.palette.common.white
							: alpha(theme.palette.text.secondary, 0.6),
						fontSize: config.textSize,
						fontWeight: 500,
						letterSpacing: "0.5px",
					}}
				>
					{text}
				</Typography>
			)}
		</Box>
	);
}
