import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sturdy — The words to say right now",
  description:
    "Sturdy gives parents calm, grounded words for hard moments — shaped to your child's age and what's actually happening.",
  openGraph: {
    title: "Sturdy — The words to say right now",
    description:
      "Sturdy gives parents calm, grounded words for hard moments — shaped to your child's age and what's actually happening.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
