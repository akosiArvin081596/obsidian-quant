import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Legal from "@/views/Legal";
import { LEGAL_PAGES } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
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
