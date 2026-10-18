import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DESCRIPTION, INSTAGRAM_HANDLE, KEYWORDS, SITE_NAME, socialMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

// Self-hosted from the @fontsource-variable packages instead of next/font/google:
// no download from Google during dev or build, so a network hiccup can't
// silently swap in a fallback font. Variable fonts cover every weight we use.
const spaceGrotesk = localFont({
  src: "../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
  variable: "--font-space-grotesk",
  weight: "300 700",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
  display: "swap",
});

// Defaults for every page; pages add their own title, description and
// canonical URL (a canonical here would point every page at the home page).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: KEYWORDS,
  authors: [{ name: `The team behind ${INSTAGRAM_HANDLE}`, url: "/" }],
  creator: INSTAGRAM_HANDLE,
  publisher: SITE_NAME,
  category: "Game development",
  // Let search engines show large image previews and full snippets.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  formatDetection: { telephone: false, address: false, email: false },
  ...socialMetadata({ title: SITE_NAME }),
  // The site as plain Markdown for LLMs (app/llms.txt).
  alternates: { types: { "text/markdown": "/llms.txt" } },
};

export const viewport: Viewport = {
  themeColor: "#f3f3f3",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
