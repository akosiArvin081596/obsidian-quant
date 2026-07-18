/**
 * Temporary mini SEO database — paste approved Google Sheet values here.
 * Pages look up entries via `seoFor(key)` in `src/lib/seo.ts`.
 */
import { ARCHITECTURE, BRAND, CONTACT, FIRM, HERO, LEGAL_PAGES, STRATEGY } from "./site";

export type SeoEntry = {
  title: string;
  description: string;
  path: string;
  focusKeyword?: string;
  socialTitle?: string;
  socialDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  /** When true, emit noindex (paused / private shells). */
  noIndex?: boolean;
};

export const seoData = {
  home: {
    title: `${BRAND.name} | Profit from Market Dislocation`,
    description: `${HERO.sub} ${BRAND.intro}`,
    path: "/",
    focusKeyword: "quantitative investment strategies",
  },
  firm: {
    title: "The Firm",
    description: FIRM.hero.body,
    path: "/firm",
    focusKeyword: "Obsidian Quant Group",
  },
  strategy: {
    title: "Strategy",
    description: STRATEGY.hero.body,
    path: "/strategy",
    focusKeyword: "quantitative investment strategies",
  },
  architecture: {
    title: "Architecture",
    description: ARCHITECTURE.body,
    path: "/architecture",
    focusKeyword: "quantitative investment architecture",
  },
  contact: {
    title: "Request Access",
    description: CONTACT.body,
    path: "/contact",
    focusKeyword: "institutional briefing",
  },
  insights: {
    title: "Insights",
    description: BRAND.intro,
    path: "/insights",
    focusKeyword: "quantitative research",
    noIndex: true,
  },
  "regulatory-disclosure": {
    title: LEGAL_PAGES["regulatory-disclosure"].title,
    description: LEGAL_PAGES["regulatory-disclosure"].body,
    path: "/legal/regulatory-disclosure",
    focusKeyword: "regulatory disclosure",
  },
  "data-cryptography": {
    title: LEGAL_PAGES["data-cryptography"].title,
    description: LEGAL_PAGES["data-cryptography"].body,
    path: "/legal/data-cryptography",
    focusKeyword: "data cryptography",
  },
} as const satisfies Record<string, SeoEntry>;

export type SeoKey = keyof typeof seoData;
