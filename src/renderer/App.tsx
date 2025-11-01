import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { useState } from "react";
import queryClient from "../lib/QueryClient";
import theme from "../lib/theme";
import { AppLayout } from "./components/layout/AppLayout";
import { AppPage } from "./components/layout/AppBar";
import ContactsTab from "./components/tabs/ContactsTab";
import InventoryTab from "./components/tabs/InventoryTab";
import HomeTab from "./components/tabs/HomeTab";
import { useGlobalShortcuts } from "../hooks/keyboard/useGlobalShortcuts";
import NewInvoiceTab from "./components/tabs/NewInvoiceTab";
import InvoicesTab from "./components/tabs/InvoicesTab";
import { TabPersistenceProvider } from "../context/TabPersistanceContext";

function App() {
	const [currentPage, setCurrentPage] = useState<AppPage>("domu");

	useGlobalShortcuts(setCurrentPage);

	const renderPage = () => {
		switch (currentPage) {
			case "domu":
				return <HomeTab />;
			case "adresar":
				return <ContactsTab />;
			case "sklad":
				return <InventoryTab />;
			case "novy_doklad":
				return <NewInvoiceTab />;
			case "doklady":
				return <InvoicesTab />;
			default:
				return null;
		}
	};

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<TabPersistenceProvider>
					<AppLayout currentPage={currentPage} onPageChange={setCurrentPage}>
						{renderPage()}
					</AppLayout>
				</TabPersistenceProvider>
				{/* Dev tools - remove in production */}
				<ReactQueryDevtools initialIsOpen={false} />
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export default App;
