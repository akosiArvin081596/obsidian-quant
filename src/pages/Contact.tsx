import { memo, useState } from "react";
import type { FormEvent } from "react";
import PageHero from "../components/PageHero";
import Section from "../components/Section";
import Button from "../components/Button";
import Reveal from "../components/Reveal";
import Spotlight from "../components/Spotlight";
import { BRAND, CONTACT } from "../content/site";
import { cn } from "../lib/cn";

const inputClass =
  "w-full rounded-none border border-gold/20 bg-midnight/70 px-4 py-3.5 text-sm text-ghost placeholder:text-silver/30 transition-colors focus:border-gold focus:outline-none";
const labelClass =
  "mb-2 block text-[0.62rem] font-medium uppercase tracking-[0.24em] text-silver/55";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <PageHero
        eyebrow={CONTACT.eyebrow}
        title={CONTACT.title}
        body={CONTACT.body}
      />

      <Section className="bg-midnight" spacing="py-20 lg:py-28">
        <div className="relative grid grid-cols-1 gap-14 lg:grid-cols-12">
          {/* ambient gold bloom seated behind the form + sidebar */}
          <div
            aria-hidden
            className="gold-bloom pointer-events-none absolute left-[38%] top-1/2 h-[26rem] w-[26rem] -translate-y-1/2 opacity-60"
          />
          {/* Form */}
          <Reveal className="lg:col-span-7">
            <Spotlight size={360} strength={0.1}>
              <div className="relative z-10 border border-gold/15 bg-obsidian/50 p-8 backdrop-blur-sm lg:p-10 gold-grid">
              {submitted ? (
                <div className="flex min-h-[26rem] flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center border border-graph/50 text-graph">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-6 font-serif text-2xl text-ghost">
                    Credentials received.
                  </h3>
                  <p className="mt-3 max-w-sm text-sm font-light text-silver/60">
                    Your submission has entered our secure verification queue.
                    Our technical committee will respond to qualified
                    institutional counterparties directly.
                  </p>
                  <p className="mt-6 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-gold">
                    REF · OQG-{new Date().getFullYear()}-VERIFY
                  </p>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={onSubmit} noValidate>
                  <div>
                    <label className={labelClass} htmlFor="entity">
                      {CONTACT.fields.entity}
                    </label>
                    <input
                      id="entity"
                      type="text"
                      required
                      placeholder={CONTACT.fields.entityPlaceholder}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="email">
                      {CONTACT.fields.email}
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder={CONTACT.fields.emailPlaceholder}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="mandate">
                      Counterparty Profile
                    </label>
                    <select id="mandate" className={cn(inputClass, "appearance-none")}>
                      <option>Sovereign Wealth Fund</option>
                      <option>Family Office</option>
                      <option>Institutional Allocator</option>
                      <option>Other Qualified Entity</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="note">
                      Briefing Notes <span className="text-silver/30">(optional)</span>
                    </label>
                    <textarea
                      id="note"
                      rows={4}
                      placeholder="Mandate objectives, timeline, jurisdiction…"
                      className={cn(inputClass, "resize-none")}
                    />
                  </div>
                  <Button type="submit" variant="primary" full>
                    {CONTACT.submit}
                  </Button>
                  <p className="text-center text-[0.62rem] uppercase tracking-[0.2em] text-silver/35">
                    Transmitted under data-cryptography protocol
                  </p>
                </form>
              )}
              </div>
            </Spotlight>
          </Reveal>

          {/* Secure info */}
          <Reveal delay={0.12} className="lg:col-span-5">
            <h3 className="font-serif text-2xl text-ghost">
              A restricted channel.
            </h3>
            <p className="mt-4 text-sm font-light leading-relaxed text-silver/60">
              Obsidian Quant does not solicit retail capital. Inquiries are
              reviewed on a limited-capacity basis and reserved for institutional
              counterparties — sovereign wealth funds, family offices, and
              qualified allocators.
            </p>

            <div className="mt-10 space-y-6">
              <div className="border-l border-gold/30 pl-5">
                <div className="text-[0.62rem] uppercase tracking-[0.24em] text-silver/45">
                  Secure Correspondence
                </div>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="mt-1 block text-sm text-ghost transition-colors hover:text-gold"
                >
                  {BRAND.email}
                </a>
              </div>
              <div className="border-l border-gold/30 pl-5">
                <div className="text-[0.62rem] uppercase tracking-[0.24em] text-silver/45">
                  Presence
                </div>
                <div className="mt-1 text-sm text-ghost">
                  {BRAND.presence.join(" · ")}
                </div>
              </div>
              <div className="border-l border-gold/30 pl-5">
                <div className="text-[0.62rem] uppercase tracking-[0.24em] text-silver/45">
                  Established
                </div>
                <div className="mt-1 text-sm text-ghost">
                  {BRAND.established}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
};

export default memo(Contact);
