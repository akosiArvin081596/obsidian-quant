import type { Metadata } from "next";
import { BRAND } from "../content/site";
import { seoData, type SeoEntry, type SeoKey } from "../content/seoData";

export const SITE_URL = "https://obsidianquantgroup.com";

const DEFAULT_DESCRIPTION = BRAND.intro;
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/obsidian-gem.webp`;

type PageSeo = {
  title: string;
  description?: string;
  path: string;
  focusKeyword?: string;
  socialTitle?: string;
  socialDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  /** When true, emit noindex (investor / private shells). */
  noIndex?: boolean;
};

const canonicalUrl = (path: string) =>
  path === "/"
    ? `${SITE_URL}/`
    : `${SITE_URL}${path.endsWith("/") ? path : `${path}/`}`;

/** Build Next.js Metadata with canonical + Open Graph for a public (or private) page. */
export const pageMetadata = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  focusKeyword,
  socialTitle,
  socialDescription,
  ogTitle,
  ogDescription,
  ogImage,
  noIndex = false,
}: PageSeo): Metadata => {
  const url = canonicalUrl(path);
  const fullTitle = title.includes(BRAND.name) ? title : `${title} | ${BRAND.name}`;
  const twitterTitle = socialTitle ?? fullTitle;
  const twitterDescription = socialDescription ?? description;
  const openGraphTitle = ogTitle ?? socialTitle ?? fullTitle;
  const openGraphDescription = ogDescription ?? socialDescription ?? description;
  const image = ogImage ?? DEFAULT_OG_IMAGE;

  return {
    title: fullTitle,
    description,
    ...(focusKeyword ? { keywords: focusKeyword } : {}),
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      url,
      siteName: BRAND.name,
      type: "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
      images: [image],
    },
  };
};

/** Look up a central `seoData` entry and build page Metadata. */
export const seoFor = (key: SeoKey): Metadata => {
  const entry: SeoEntry = seoData[key];
  return pageMetadata(entry);
};
