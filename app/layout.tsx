import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Fraunces, Outfit } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

export const dynamic = "force-dynamic";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "BorderMath — Never overstay",
    template: "%s · BorderMath",
  },
  description: "Visa-day math for nomads. Schengen 90/180, sourced stay limits, overstay alerts, and calendar export.",
  applicationName: "BorderMath",
  openGraph: {
    title: "BorderMath — Never overstay",
    description: "Visa-day math for nomads.",
    siteName: "BorderMath",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
