import "./globals.scss";
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";
import type { ReactNode } from "react";

// Use system fonts for fast load - avoids blocking Google Fonts fetch
const fontClass = "font-sans";

export const metadata = {
  title: "Return of Agents | AI Research & Document Intelligence | Afore Capital Hackathon",
  description:
    "Return of Agents — AI-powered research and document reader built for Afore Capital Hackathon. Extract insights from web search, PDFs, and documents with intelligent agents. Explain, summarize, and explore content with conversational AI.",
  icons: {
    icon: "/logo.png",
  },
  keywords: [
    "Afore Capital",
    "Afore Capital hackathon",
    "AI hackathon",
    "Return of Agents",
    "AI research assistant",
    "AI document reader",
    "intelligent document extraction",
    "AI agents",
    "web search AI",
    "PDF AI extraction",
    "conversational AI",
    "research automation",
  ],
  openGraph: {
    title: "Return of Agents | AI Research & Document Intelligence | Afore Capital Hackathon",
    description:
      "AI-powered research and document reader built for Afore Capital Hackathon. Extract insights, explain content, and explore documents with intelligent conversational agents.",
    url: "https://returnofagents.com",
    siteName: "Return of Agents",
    images: [
      {
        url: "https://returnofagents.com/logo.png",
        width: 512,
        height: 512,
        alt: "Return of Agents - AI research and document intelligence for Afore Capital Hackathon",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Return of Agents | AI Research & Document Intelligence | Afore Capital Hackathon",
    description:
      "AI-powered research and document reader built for Afore Capital Hackathon. Extract insights with intelligent AI agents.",
    images: ["https://returnofagents.com/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://returnofagents.com",
  },
  metadataBase: new URL("https://returnofagents.com"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontClass}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>

        {/* JSON-LD for SEO - WebApplication + Organization */}
        <Script id="ld-json-app" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Return of Agents",
            description:
              "AI-powered research and document intelligence platform. Extract insights from web search, PDFs, and documents with intelligent conversational agents. Built for Afore Capital Hackathon.",
            url: "https://returnofagents.com",
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            featureList: [
              "AI-powered web research with Tavily and Seda",
              "PDF document extraction and analysis",
              "Conversational explain panel for selected text",
              "Voice input and text-to-speech",
            ],
            creator: {
              "@type": "Organization",
              name: "Afore Capital",
              url: "https://afore.capital",
            },
          })}
        </Script>
        {/* LinkedIn badge - loads when browser idle to avoid blocking */}
        <Script
          src="https://platform.linkedin.com/badges/js/profile.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
