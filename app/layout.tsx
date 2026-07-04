import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono, Inter, Noto_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/provider/theme-provider";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/provider/tackstack-query-provider";
import { Toaster } from "@/components/ui/sonner";

const notoSansHeading = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduQuiz - Interactive Learning Platform",
  description: "EduQuiz - An interactive quiz and learning platform for educators and students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
        notoSansHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>{children}</QueryProvider>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
