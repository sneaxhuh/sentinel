import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/navbars/navbar";
import "./globals.css";
import ClientProviders from "@/app/providers/ClientProviders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

// Note: GT Alpina font will be loaded via CSS @font-face rules in globals.css

export const metadata: Metadata = {
  title: "Sentinel - Celo Development Platform",
  description: "Build the future on 0g with our comprehensive development platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-gt-alpina bg-gypsum text-onyx antialiased`}
      >
        <ClientProviders>
          <Navbar />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
