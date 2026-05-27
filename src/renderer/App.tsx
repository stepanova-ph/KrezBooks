import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Box, Typography, Button } from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import queryClient from "../lib/QueryClient";
import theme from "../lib/theme";

import { AppLayout } from "./components/layout/AppLayout";
import { AppPage } from "./components/layout/AppBar";

import ContactsTab from "./components/tabs/ContactsTab";
import InventoryTab from "./components/tabs/InventoryTab";
import NewInvoiceTab from "./components/tabs/NewInvoiceTab";
import InvoicesTab from "./components/tabs/InvoicesTab";

import { useGlobalShortcuts } from "../hooks/keyboard/useGlobalShortcuts";
import { TabPersistenceProvider } from "../context/TabPersistanceContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";

function App() {
	const [currentPage, setCurrentPage] = useState<AppPage>("novy_doklad");

	useGlobalShortcuts(setCurrentPage);

	const renderPage = () => {
		const tabFallback = (error: Error, reset: () => void) => (
			<Box sx={{ p: 4, textAlign: "center" }}>
				<Typography variant="h6" gutterBottom>
					V této záložce došlo k chybě
				</Typography>
				<Typography variant="body2" color="text.secondary" paragraph>
					{error.message}
				</Typography>
				<Button variant="contained" onClick={reset}>
					Zkusit znovu
				</Button>
			</Box>
		);

		let tab: React.ReactNode;
		switch (currentPage) {
			case "adresar":
				tab = <ContactsTab />;
				break;
			case "sklad":
				tab = <InventoryTab />;
				break;
			case "novy_doklad":
				tab = <NewInvoiceTab />;
				break;
			case "doklady":
				tab = <InvoicesTab />;
				break;
			default:
				tab = <NewInvoiceTab />;
		}

		return (
			<ErrorBoundary key={currentPage} fallback={tabFallback}>
				{tab}
			</ErrorBoundary>
		);
	};

	return (
		<QueryClientProvider client={queryClient}>
			<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
				<ThemeProvider theme={theme}>
					<CssBaseline />
					<TabPersistenceProvider>
						<AppLayout currentPage={currentPage} onPageChange={setCurrentPage}>
							{renderPage()}
						</AppLayout>
					</TabPersistenceProvider>
				</ThemeProvider>
			</LocalizationProvider>
		</QueryClientProvider>
	);
}

export default App;
