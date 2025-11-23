import { useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
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

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";

function App() {
	const [currentPage, setCurrentPage] = useState<AppPage>("novy_doklad");

	useGlobalShortcuts(setCurrentPage);

	const renderPage = () => {
		switch (currentPage) {
			case "adresar":
				return <ContactsTab />;
			case "sklad":
				return <InventoryTab />;
			case "novy_doklad":
				return <NewInvoiceTab />;
			case "doklady":
				return <InvoicesTab />;
			default:
				return <NewInvoiceTab />;
		}
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
