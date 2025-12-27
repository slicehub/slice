"use client";

import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, cookieToInitialState } from "wagmi";
import { PRIVY_APP_ID, PRIVY_CLIENT_ID } from "@/config/app";
import { config } from "@/config";

const queryClient = new QueryClient();

export default function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies?: string | null;
}) {
  // Optional: Rehydrate Wagmi state from cookies if you use SSR
  const initialState = cookieToInitialState(config, cookies);

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#1b1c23",
          logo: "/images/slice-logo-light.svg",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        loginMethods: ["email", "wallet"],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config} initialState={initialState}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
