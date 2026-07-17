import type { Metadata } from "next";
import { BRAND } from "../content/site";

export const SITE_URL = "https://obsidianquantgroup.com";

const DEFAULT_DESCRIPTION = BRAND.intro;
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/obsidian-gem.webp`;

type PageSeo = {
  title: string;
  description?: string;
  path: string;
  /** When true, emit noindex (investor / private shells). */
  noIndex?: boolean;
};

/** Build Next.js Metadata with canonical + Open Graph for a public (or private) page. */
export const pageMetadata = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  noIndex = false,
}: PageSeo): Metadata => {
  const url =
    path === "/"
      ? `${SITE_URL}/`
      : `${SITE_URL}${path.endsWith("/") ? path : `${path}/`}`;
  const fullTitle = title.includes(BRAND.name) ? title : `${title} | ${BRAND.name}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: BRAND.name,
      type: "website",
      images: [{ url: DEFAULT_OG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
};
