// app/layout.tsx (server component)
import "../styles/globals.css"; // base global styles (resets, utilities, etc.)

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import ResumeProviderWrapper from "@/components/resume_provider_wrapper";
import Layout from "@/components/ui/Layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Resume Analyzer",
  description: "Analyze and match resumes with AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ResumeProviderWrapper>
            <Layout>
              {children}
            </Layout>
          </ResumeProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}