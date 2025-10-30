// React entry point - mounts the app into the DOM

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Get the root element
const container = document.getElementById("root");

if (!container) {
	throw new Error("Root element not found");
}

// Create React root and render the app
const root = createRoot(container);
root.render(
	<React.StrictMode>
		<ErrorBoundary>
			<App />
		</ErrorBoundary>
	</React.StrictMode>,
);
