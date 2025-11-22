// Ensure window is available for bb.js before any imports
if (typeof window === "undefined" && typeof globalThis !== "undefined") {
  const globalScope = globalThis as typeof globalThis & {
    window?: typeof globalThis;
  };
  globalScope.window = globalScope;
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "@stellar/design-system/build/styles.min.css";
import { WalletProvider } from "./providers/WalletProvider.tsx";
import { NotificationProvider } from "./providers/NotificationProvider.tsx";
import { PrizePoolProvider } from "./contexts/PrizePoolContext.tsx";
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
          <PrizePoolProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </PrizePoolProvider>
        </WalletProvider>
      </QueryClientProvider>
    </NotificationProvider>
  </StrictMode>,
);
