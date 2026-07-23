/**
 * Temporary mini SEO database — paste approved Google Sheet values here.
 * Pages look up entries via `seoFor(key)` in `src/lib/seo.ts`.
 *
 * Source: Copy of SEO On-Page Contents
 * https://docs.google.com/spreadsheets/d/1UiANVNDZl6xBLLSCrYyN8v_nYxwf70J0ehikU7cbt2c
 */
import { BRAND, CONTACT, LEGAL_PAGES } from "./site";

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
    title: "Quantitative Asset Management | Obsidian Quant Group",
    description:
      "Obsidian Quant Group is a quantitative asset management firm delivering systematic investment strategies for institutional and eligible individual investors.",
    path: "/",
    focusKeyword: "quantitative asset management",
    socialTitle: "Obsidian Quant Group | Quantitative Asset Management",
    socialDescription:
      "Discover Obsidian Quant Group's approach to quantitative asset management and systematic investment strategies for institutional and eligible individual investors.",
    ogTitle: "Quantitative Asset Management | Obsidian Quant Group",
    ogDescription:
      "Explore systematic, research-driven investment strategies from Obsidian Quant Group, serving institutional and eligible individual investors.",
  },
  firm: {
    title: "About Obsidian Quant Group | Quantitative Investment Firm",
    description:
      "Learn about Obsidian Quant Group, a quantitative investment firm focused on systematic, research-driven investment strategies for sophisticated investors.",
    path: "/firm",
    focusKeyword: "quantitative investment firm",
    socialTitle: "About Obsidian Quant Group | Our Firm",
    socialDescription:
      "Discover Obsidian Quant Group's approach to quantitative investing, systematic research, and disciplined investment management.",
    ogTitle: "About Obsidian Quant Group | Quantitative Investment Firm",
    ogDescription:
      "Learn about Obsidian Quant Group and our research-driven approach to systematic quantitative investment management.",
  },
  strategy: {
    title: "Quantitative Investment Strategies | Obsidian Quant Group",
    description:
      "Explore Obsidian Quant Group's quantitative investment strategies, built on systematic research, disciplined analysis, and data-driven investment processes.",
    path: "/strategy",
    focusKeyword: "quantitative investment strategies",
    socialTitle: "Quantitative Investment Strategies | Obsidian Quant Group",
    socialDescription:
      "Explore our systematic approach to quantitative investing and discover how research, data, and disciplined processes shape our investment strategies.",
    ogTitle: "Quantitative Investment Strategies | Obsidian Quant Group",
    ogDescription:
      "Discover Obsidian Quant Group's systematic, research-driven approach to quantitative investment strategies and portfolio management.",
  },
  architecture: {
    title: "Quantitative Investment Process | Obsidian Quant Group",
    description:
      "Explore Obsidian Quant Group's quantitative investment process, integrating systematic research, data analysis, portfolio construction, and risk management.",
    path: "/architecture",
    focusKeyword: "quantitative investment process",
    socialTitle: "Our Quantitative Investment Process | Obsidian Quant Group",
    socialDescription:
      "Explore the research, data analysis, portfolio construction, and risk management framework behind Obsidian Quant Group's systematic investment approach.",
    ogTitle: "Quantitative Investment Process | Obsidian Quant Group",
    ogDescription:
      "Discover the systematic framework behind Obsidian Quant Group's approach to quantitative research, portfolio construction, and investment risk management.",
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
