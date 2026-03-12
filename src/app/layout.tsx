import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
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
  title: "AJO Server-Side Decisioning POC",
  description:
    "Next.js App Router POC demonstrating server-rendered offers and tracking events back to a mock AJO service.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adobeLaunchSrc =
    process.env.NEXT_PUBLIC_ADOBE_LAUNCH_SRC ??
    "https://assets.adobedtm.com/1b589233d051/7af0497cf96b/launch-546ebea45660-development.min.js";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-black dark:text-zinc-50`}
      >
        {adobeLaunchSrc ? (
          <Script src={adobeLaunchSrc} strategy="afterInteractive" async />
        ) : null}
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur dark:border-zinc-800 dark:bg-black/60">
          <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center text-sm font-bold">
                AJO
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Decisioning POC</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Server-side offers + tracking
                </div>
              </div>
            </div>
            <nav className="flex items-center gap-3 text-sm">
              <Link
                className="rounded-lg px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                href="/"
              >
                Home
              </Link>
              <Link
                className="rounded-lg px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                href="/offers"
              >
                Offers
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
