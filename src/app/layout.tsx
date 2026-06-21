import type { Metadata } from "next";
import { Barlow_Condensed, Work_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const barlow = Barlow_Condensed({
  variable: "--font-heading",
  weight: ["700"],
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-body",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StockPilot — Inventory Management",
  description: "Multitenant inventory management for small shop owners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${workSans.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              border: "1px dashed var(--border)",
              borderRadius: 0,
              fontFamily: "var(--font-body)",
            },
          }}
        />
      </body>
    </html>
  );
}
