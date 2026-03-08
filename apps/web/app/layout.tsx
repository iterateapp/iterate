import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { getThreads, getIterationSteps, getGitHubData } from "@/lib/queries";
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
  title: "Iterate — AI Product Manager",
  description: "Closed-loop AI product management system",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [threads, iterationSteps, githubData] = await Promise.all([
    getThreads(),
    getIterationSteps(),
    getGitHubData(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppShell
          initialThreads={threads}
          iterationSteps={iterationSteps}
          repoInfo={githubData.repoInfo}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
