import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Playfair_Display({ variable: "--font-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lawn & Loom · Summer lawn, kurtas and formals",
  description:
    "Shop lawn suits, kurtas and formals with cash on delivery across Pakistan. ShopAssist, our AI assistant, tracks orders, starts returns and finds your size, 24/7.",
  openGraph: {
    title: "Lawn & Loom × ShopAssist",
    description: "A demo store with an AI support agent that answers from store policies and takes real actions: order tracking, returns, product search and human hand-off.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#1f4d3a" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
