import type { Metadata } from "next";
import { Barlow_Condensed, Work_Sans, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
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
  manifest: "/manifest.json",
  other: {
    "theme-color": "#0a0a0a",
  },
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
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function() {
            var t = localStorage.getItem("theme");
            if (t !== "light") document.documentElement.classList.add("dark");
          })();`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: "var(--font-body)",
            },
          }}
        />
        <Script id="sw-unregister" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then(function(regs) { for (var i = 0; i < regs.length; i++) regs[i].unregister(); }); }`}
        </Script>
      </body>
    </html>
  );
}
