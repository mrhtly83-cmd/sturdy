import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
          title: "Sturdy | What should I say right now?",
            description:
                "Sturdy gives parents calm, practical words for hard moments — fast.",
                };

                export default function RootLayout({
                  children,
                  }: Readonly<{
                    children: React.ReactNode;
                    }>) {
                      return (
                          <html lang="en">
                                <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                                        {children}
                                              </body>
                                                  </html>
                                                    );
                                                    }