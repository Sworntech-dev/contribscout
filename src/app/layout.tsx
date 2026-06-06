import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "ContribScout";

export const metadata: Metadata = {
  title: `${appName} | Contributor Intelligence`,
  description:
    "A Hermes-ready contributor intelligence dashboard for early Web3 and AI opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
