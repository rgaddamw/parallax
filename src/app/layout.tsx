import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Parallax — Secure Multi-Agent Interviews (NemoClaw)",
  description:
    "OpenClaw orchestration with NemoClaw + OpenShell policy: autonomous interview agents on sensitive hiring data, audit-ready and bounded by YAML.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
