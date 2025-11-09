import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ScrollButtons } from "@/components/ScrollButtons";
import { AudioProvider } from "@/contexts/AudioContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShortStream",
  description: "Short-form video streaming platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AudioProvider>
          <Logo />
          <Sidebar />
          <Header />
          <ScrollButtons />
          <main>{children}</main>
        </AudioProvider>
      </body>
    </html>
  );
}
