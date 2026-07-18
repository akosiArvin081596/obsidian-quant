import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Legal from "@/views/Legal";
import { LEGAL_PAGES } from "@/content/site";
import { seoData, type SeoKey } from "@/content/seoData";
import { pageMetadata, seoFor } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map((slug) => ({ slug }));
}

const isSeoKey = (slug: string): slug is SeoKey => slug in seoData;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (isSeoKey(slug)) return seoFor(slug);

  // A legal page added to LEGAL_PAGES without a matching seoData entry would
  // otherwise export with no title, canonical, or robots at all — a silent SEO
  // hole. Fall back to the page's own content instead. (seoData.test.ts asserts
  // the two stay in sync, but tests don't gate the deploy, so this is the net.)
  const page = LEGAL_PAGES[slug as keyof typeof LEGAL_PAGES];
  if (!page) return {};
  return pageMetadata({
    title: page.title,
    description: page.body,
    path: `/legal/${slug}`,
  });
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  if (!(slug in LEGAL_PAGES)) notFound();
  return <Legal slug={slug} />;
}
