import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Legal from "@/views/Legal";
import { LEGAL_PAGES } from "@/content/site";
import { seoData, type SeoKey } from "@/content/seoData";
import { seoFor } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map((slug) => ({ slug }));
}

const isSeoKey = (slug: string): slug is SeoKey => slug in seoData;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isSeoKey(slug)) return {};
  return seoFor(slug);
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  if (!(slug in LEGAL_PAGES)) notFound();
  return <Legal slug={slug} />;
}
