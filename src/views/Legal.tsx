"use client";

import { memo } from "react";
import Link from "next/link";
import PageHero from "../components/PageHero";
import Section from "../components/Section";
import { LEGAL_PAGES } from "../content/site";

type LegalProps = {
  slug: string;
};

const Legal = ({ slug }: LegalProps) => {
  const page = LEGAL_PAGES[slug as keyof typeof LEGAL_PAGES];
  if (!page) return null;

  return (
    <>
      <PageHero eyebrow={page.eyebrow} title={page.title} body={page.body} standardHeight />
      <Section className="border-b border-gold/15" spacing="py-14 lg:py-16">
        <div className="mx-auto grid max-w-3xl gap-10">
          {page.sections.map((section) => (
            <article key={section.heading}>
              <h2 className="text-display text-2xl text-ghost sm:text-3xl">{section.heading}</h2>
              <p className="mt-4 text-sm font-light leading-relaxed text-silver/65">{section.copy}</p>
            </article>
          ))}
          <p className="border-t border-gold/15 pt-8 text-xs text-silver/50">
            Questions on this notice?{" "}
            <Link href="/contact" className="text-gold transition-colors hover:text-warm-gold">
              Contact Obsidian Quant
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
};

export default memo(Legal);
