import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yuvraj Mishra — Environment Artist",
  description:
    "Field notes on sky. Yuvraj Mishra builds 3D environments with skies you can stand under — deserts, coasts, harbors, alps, monsoon hills.",
  openGraph: {
    title: "Yuvraj Mishra — Environment Artist",
    description:
      "I build worlds around their skies. Every environment starts as weather — the ground is just where the light lands.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f3ec",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${spaceMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
