import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NwisWorkspaceProvider } from "@/components/nwis-workspace-context";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NWIS | Nearby Wells Intelligence System",
  description: "Professional upstream drilling intelligence and historical well context platform prototype.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-100 text-slate-900">
        <NwisWorkspaceProvider>{children}</NwisWorkspaceProvider>
      </body>
    </html>
  );
}
