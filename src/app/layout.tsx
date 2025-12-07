import type { Metadata } from "next";

import { headers } from "next/headers"; // added
import "./globals.css";
import ContextProvider from "@/contexts";
import { XOContractsProvider } from "@/providers/XOContractsProvider";
import { EmbeddedProvider } from "@/providers/EmbeddedProvider";
import { Geist, Geist_Mono } from "next/font/google";
import { TimerProvider } from "@/contexts/TimerContext";

export const metadata: Metadata = {
  title: "Slice",
  description: "Earn funds while solving disputes",
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
            <XOContractsProvider>
              <TimerProvider>
                <div className="w-full max-w-[430px] min-h-screen bg-white shadow-2xl relative flex flex-col">
                  {children}
                </div>
              </TimerProvider>
            </XOContractsProvider>
          </ContextProvider>
        </EmbeddedProvider>
      </body>
    </html>
  );
}
