import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { GeistSans } from "geist/font/sans";

import { Toaster } from "@/components/ui/toaster";
import { themeInitScript } from "@/lib/theme";
import { Providers } from "@/providers";
import "@/styles/globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tweet Pulse · Daily tweet goal",
  description:
    "See how many times you've posted today: originals, replies, retweets and quotes, counted on Beijing time against your daily goal.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e4e7ea" },
    { media: "(prefers-color-scheme: dark)", color: "#141516" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${archivo.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
