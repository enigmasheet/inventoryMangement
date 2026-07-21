import type { Metadata } from "next";
import { Barlow_Condensed, Work_Sans, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeSync } from "@/components/theme-sync";
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
  title: "Sajilo Inventory",
  description: "Sajilo Inventory — Multitenant inventory management for small shop owners. Track stock, define custom fields, and manage your shop.",
  icons: {
    icon: "/web/icons8-inventory-arcade-32.png",
    shortcut: "/web/icons8-inventory-arcade-16.png",
    apple: "/web/icons8-inventory-arcade-96.png",
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
        <meta name="view-transition" content="same-origin" />
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function() {
            var t = localStorage.getItem("theme");
            if (t === "light") {
              document.documentElement.classList.remove("dark");
              document.querySelector("meta[name='theme-color']")?.setAttribute("content", "#fafafa");
            } else if (t === "dark") {
              document.documentElement.classList.add("dark");
            } else {
              if (window.matchMedia("(prefers-color-scheme: light)").matches) {
                document.documentElement.classList.remove("dark");
                document.querySelector("meta[name='theme-color']")?.setAttribute("content", "#fafafa");
              } else {
                document.documentElement.classList.add("dark");
              }
            }
          })();`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <ThemeSync />
          {children}
        </TooltipProvider>
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
      </body>
    </html>
  );
}
