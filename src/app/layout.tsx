import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/ui/Nav";
import SessionProviderWrapper from "@/components/ui/SessionProviderWrapper";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "PAINT PLANNER PRO",
  description: "Miniature painter's companion — paint library, color matching, scheme planning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-bg text-green font-terminal scanline-flicker">
        <SessionProviderWrapper>
          <Nav />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <footer className="border-t border-border px-4 py-2 text-xs text-green-dim flex justify-between">
            <span>PAINT PLANNER PRO v0.1.0</span>
            <span className="blink">█</span>
          </footer>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
