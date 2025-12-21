import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import ContextProvider from "@/contexts";
import { ConnectProvider } from "@/providers/ConnectProvider";
import { EmbeddedProvider } from "@/providers/EmbeddedProvider";
import { Geist, Geist_Mono } from "next/font/google";
import { TimerProvider } from "@/contexts/TimerContext";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { ConsoleOverlay } from "@/components/debug/ConsoleOverlay";
import { NetworkDebugger } from "@/components/debug/NetworkDebugger";

export const metadata: Metadata = {
  title: "Slice",
  description: "Get paid for doing justice",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/slice-logo-light.svg",
    apple: "/icons/icon.png",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersData = await headers();
  const cookies = headersData.get("cookie");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex justify-center min-h-screen bg-gray-100`}
      >
        <EmbeddedProvider>
          <ContextProvider cookies={cookies}>
            <ConnectProvider>
              <TimerProvider>
                {/* Updated Structure:
                  1. relative: allows absolute positioning inside if needed
                  2. flex flex-col: enables the "sticky footer" layout
                */}
                <div className="w-full max-w-[430px] min-h-screen bg-white shadow-2xl relative flex flex-col">
                  {/* Content grows to fill space, pushing nav to bottom */}
                  {/* The pb adds a safe zone at the bottom of every page so content */}
                  <div className="flex-1 flex flex-col pb-[70px]">
                    {children}
                  </div>

                  {/* Persistent Bottom Navigation */}
                  <BottomNavigation />

                  {/* Debug Overlay */}
                  {process.env.NEXT_PUBLIC_IS_EMBEDDED === "true" && (
                    <ConsoleOverlay />
                  )}
                  <NetworkDebugger />
                </div>
              </TimerProvider>
            </ConnectProvider>
          </ContextProvider>
        </EmbeddedProvider>
      </body>
    </html>
  );
}
