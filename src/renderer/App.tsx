import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import InvoiceTab from "./components/tabs/InvoiceTab";

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>("domu");

  // enable f1-f5 keyboard shortcuts for tab navigation
  useGlobalShortcuts(setCurrentPage);

  const renderPage = () => {
    switch (currentPage) {
      case "domu":
        return <HomeTab />;
      case "adresar":
        return <ContactsTab />;
      case "sklad":
        return <InventoryTab />;
      case "ucetnictvi":
        return <InvoiceTab />
      default:
        return null;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <AppLayout currentPage={currentPage} onPageChange={setCurrentPage}>
          {renderPage()}
        </AppLayout>

        {/* Dev tools - remove in production */}
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;