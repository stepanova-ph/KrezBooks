import React from "react";
import { Box, Typography, Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface Props {
	children: React.ReactNode;
	fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught:", error, errorInfo);
	}

	private handleReset = () => {
		this.setState({ hasError: false, error: undefined });
	};

	render() {
		if (this.state.hasError) {
			const { fallback } = this.props;
			const error = this.state.error || new Error("Neznámá chyba");

			if (fallback) {
				if (typeof fallback === "function") {
					return fallback(error, this.handleReset);
				}
				return fallback;
			}

			return (
				<Box sx={{ p: 4, textAlign: "center" }}>
					<ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
					<Typography variant="h4" gutterBottom>
						Něco se pokazilo
					</Typography>
					<Typography variant="body1" color="text.secondary" paragraph>
						{error.message}
					</Typography>
					<Button variant="contained" onClick={() => window.location.reload()}>
						Obnovit aplikaci
					</Button>
				</Box>
			);
		}

		return this.props.children;
	}
}
