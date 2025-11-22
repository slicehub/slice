// Ensure window is available for bb.js before any imports
if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
  (globalThis as any).window = globalThis;
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "@stellar/design-system/build/styles.min.css";
import { WalletProvider } from "./providers/WalletProvider.tsx";
import { NotificationProvider } from "./providers/NotificationProvider.tsx";
import { VotingProvider } from "./contexts/VotingContext.tsx";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <VotingProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </VotingProvider>
        </WalletProvider>
      </QueryClientProvider>
    </NotificationProvider>
  </StrictMode>,
);
