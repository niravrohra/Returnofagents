"use client";

import { Button } from "@/components/ui/button";
import { Mail, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-black dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="w-full border-b border-black/5 dark:border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-sm tracking-wide text-slate-600 dark:text-gray-300">
            nr
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/niravrohra"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/nirav-rohra"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              LinkedIn
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-8">
          {/* Name + one-liner */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-semibold">
              Nirav Rohra
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-gray-400">
              building honrly.com and a few quiet systems around AI, security, and infra. mostly making it harder to cheat and easier to trust what you see.
            </p>
          </div>

          {/* Subtle "AI help for business" line */}
          <p className="text-xs md:text-sm text-slate-500 dark:text-gray-500 max-w-xl mx-auto">
            if you&apos;re trying to use AI for real work - catching scams, cleaning up data, or giving your team a useful copilot - that&apos;s the kind of mess I enjoy.
          </p>

          {/* Honrly logo */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <img
              src="https://honrly.com/logo.png"
              alt="Honrly — AI-powered integrity and interview monitoring platform"
              className="h-10 md:h-12 opacity-90"
            />
            <a
              href="https://honrly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              honrly.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Other products */}
          <div className="flex flex-col items-center gap-2 pt-4 text-xs text-slate-500 dark:text-gray-400">
            <span className="uppercase tracking-[0.2em] text-[0.6rem] text-slate-500/80 dark:text-gray-500">
              side things
            </span>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://aplcard.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                aplcard.com
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://ziqara.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ziqara.com
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Previous stuff – very brief */}
          <div className="pt-4 text-[0.8rem] text-slate-500 dark:text-gray-500 max-w-xl mx-auto">
            <p>
              previously: kept UT Dallas labs running, sifted through state-sponsored malware logs, shipped client systems since 2019, and somehow ended up running student councils.
            </p>
          </div>

          {/* T-Rex runner */}
          <div className="pt-8 space-y-2">
            <p className="text-[0.75rem] text-slate-500 dark:text-gray-500">
              if you&apos;re bored already, there&apos;s a T-Rex.
            </p>
            <div className="border border-black/5 dark:border-white/10 rounded-lg overflow-hidden max-w-xl mx-auto flex justify-center bg-black">
              <iframe
                src="/dino/index.html"
                width={640}
                height={220}
                style={{ border: "none" }}
                title="T-Rex Runner"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="pt-6">
            <Button
              size="sm"
              className="rounded-full px-5 bg-black text-white hover:bg-slate-900 dark:bg-white dark:text-black dark:hover:bg-gray-200 border border-black/10 dark:border-white/20"
              asChild
            >
              <a href="mailto:hello@honrly.com?subject=AI%20help%20for%20our%20team">
                <Mail className="h-4 w-4 mr-2" />
                Say hi
              </a>
            </Button>
          </div>

          {/* Extra SEO text (kept subtle) */}
          <p className="text-[0.7rem] text-slate-400 dark:text-gray-600 max-w-xl mx-auto">
            work usually looks like: plugging AI into existing products, building fraud and abuse detectors, interview integrity tools, and internal copilots that don&apos;t fall apart in production.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-black/5 dark:border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 text-[0.7rem] text-slate-500 dark:text-gray-500 flex items-center justify-end">
          <span>shipping quietly for teams that need AI to actually work.</span>
        </div>
      </footer>
    </div>
  );
}
