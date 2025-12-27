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
  title: "MiniY3 - Simple Web3 Gaming Platform",
  description:
    "Mainkan game seru dan simpel seperti Lucky Number Duel bersama teman secara online atau lokal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
          <div className="container flex h-14 max-w-screen-2xl items-center px-4">
            <div className="mr-4 flex">
              <a className="mr-6 flex items-center space-x-2" href="/">
                <span className="font-bold sm:inline-block text-xl tracking-tighter">
                  MINI<span className="text-primary">Y3</span>
                </span>
              </a>
            </div>
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
              <nav className="flex items-center space-x-4 text-sm font-medium">
                <a
                  href="#"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Games
                </a>
                <a
                  href="#"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  About
                </a>
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-border/40 py-6 md:px-8 md:py-0">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4">
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
              Indraprhmbd. &copy; 2025 MiniY3.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
