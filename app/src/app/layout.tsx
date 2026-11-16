import type { Metadata } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ThemeProvider } from "@/components/theme-provider";
import { themeInitScript } from "@/lib/theme";

// Display / headlines. Anton ships a single (heavy) weight; bold synthesis
// is disabled on <html> so "font-black" headings don't get faux-emboldened.
const display = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rectangle's — Cultures that connect",
  description:
    "Independent cultural store. Skate, music, video games, and retro computing.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning is required because the inline script below
    // mutates `data-theme` before React hydrates, which would otherwise be
    // flagged as a hydration mismatch.
    <html
      lang="en"
      data-theme="system"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
      style={{ fontSynthesisWeight: "none" }}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
