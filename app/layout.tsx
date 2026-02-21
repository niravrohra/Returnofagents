import "./globals.scss";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";
import type { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI Consulting for Businesses | Applied AI, Security & Automation | Nirav Rohra",
  description:
    "Hands-on AI help for businesses: fraud and abuse detection, interview integrity, security analytics, and internal copilots. Practical machine learning and LLM systems that actually ship.",
  icons: {
    icon: "/logo.png",
  },
  keywords: [
    "AI consulting",
    "AI for business",
    "machine learning engineer",
    "LLM consulting",
    "AI security",
    "AI fraud detection",
    "AI for startups",
    "AI for enterprises",
    "Nirav Rohra",
    "Honrly",
  ],
  openGraph: {
    title: "AI Help for Your Business | Practical ML & LLM Systems",
    description:
      "Applied AI, security, and automation for teams that care about reliability and real-world impact. From fraud detection to interview integrity and internal copilots.",
    url: "https://honrly.com",
    siteName: "Nirav Rohra",
    images: [
      {
        url: "https://honrly.com/logo.png",
        width: 512,
        height: 512,
        alt: "Honrly logo - AI integrity platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Help for Your Business | Practical ML & LLM Systems",
    description:
      "Hands-on AI, security, and automation for teams shipping real products. Less slide decks, more systems.",
    images: ["https://honrly.com/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>

        {/* JSON-LD for SEO */}
        <Script id="ld-json-person" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Nirav Rohra",
            description:
              "Engineer working on applied AI, security, and interview integrity systems for businesses and startups.",
            url: "https://honrly.com",
            sameAs: [
              "https://github.com/niravrohra",
              "https://www.linkedin.com/in/nirav-rohra",
              "https://honrly.com",
              "https://aplcard.com",
              "https://ziqara.com",
            ],
            knowsAbout: [
              "Artificial Intelligence",
              "Machine Learning",
              "Cybersecurity",
              "Fraud detection",
              "Interview integrity",
              "LLM applications",
              "Business process automation",
            ],
            worksFor: [
              {
                "@type": "Organization",
                name: "Honrly",
                url: "https://honrly.com",
              },
            ],
          })}
        </Script>

        {/* LinkedIn badge script */}
        <Script
          src="https://platform.linkedin.com/badges/js/profile.js"
          strategy="afterInteractive"
          async
          defer
        />
      </body>
    </html>
  );
}
