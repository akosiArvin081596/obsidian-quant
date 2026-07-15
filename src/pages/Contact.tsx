import { memo, useState } from "react";
import type { FormEvent } from "react";
import PageHero from "../components/PageHero";
import Section from "../components/Section";
import Button from "../components/Button";
import Reveal from "../components/Reveal";
import Spotlight from "../components/Spotlight";
import { BRAND, CONTACT } from "../content/site";
import { cn } from "../lib/cn";
import {
  CONTACT_INBOX,
  CONTACT_PROFILES,
  isOthersProfile,
  submitContactRequest,
} from "../lib/contact";

const inputClass =
  "w-full rounded-none border border-gold/20 bg-midnight/70 px-4 py-3.5 text-sm text-ghost placeholder:text-silver/30 transition-colors focus:border-gold focus:outline-none";
const labelClass =
  "mb-2 block text-[0.62rem] font-medium uppercase tracking-[0.24em] text-silver/55";

type Status = "idle" | "submitting" | "success" | "fallback" | "error";

const Contact = () => {
  const [profile, setProfile] = useState<string>(CONTACT_PROFILES[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const showOther = isOthersProfile(profile);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    if (!formEl.reportValidity()) return;

    setStatus("submitting");
    setMessage("");

    const result = await submitContactRequest(new FormData(formEl));

    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }

    if (result.mailtoFallback) {
      setStatus("fallback");
      setMessage(
        "We prepared an email draft as a backup. Complete and send it from your email client.",
      );
      window.location.assign(result.mailto);
      return;
    }

    setStatus("success");
    setMessage("Credentials received. Our team will review and respond through the secure channel.");
    formEl.reset();
    setProfile(CONTACT_PROFILES[0]);
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
          <div
            aria-hidden
            className="gold-bloom pointer-events-none absolute left-[38%] top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 opacity-60"
          />

          <Reveal className="lg:col-span-7">
            <Spotlight size={360} strength={0.1}>
              <div className="relative z-10 border border-gold/15 bg-obsidian/50 p-8 backdrop-blur-sm lg:p-10 gold-grid">
                <form className="space-y-6" onSubmit={onSubmit} noValidate={false}>
                  <div>
                    <label className={labelClass} htmlFor="entity">
                      {CONTACT.fields.entity}
                    </label>
                    <input
                      id="entity"
                      name="entity"
                      type="text"
                      required
                      autoComplete="organization"
                      placeholder={CONTACT.fields.entityPlaceholder}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="name">
                      {CONTACT.fields.name}
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder={CONTACT.fields.namePlaceholder}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="email">
                      {CONTACT.fields.email}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder={CONTACT.fields.emailPlaceholder}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="mandate">
                      {CONTACT.fields.profile}
                    </label>
                    <select
                      id="mandate"
                      name="profile"
                      required
                      value={profile}
                      onChange={(event) => setProfile(event.target.value)}
                      className={cn(inputClass, "appearance-none")}
                    >
                      {CONTACT_PROFILES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {showOther && (
                    <div>
                      <label className={labelClass} htmlFor="profileOther">
                        {CONTACT.fields.profileOther}
                      </label>
                      <input
                        id="profileOther"
                        name="profileOther"
                        type="text"
                        required
                        placeholder={CONTACT.fields.profileOtherPlaceholder}
                        className={inputClass}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelClass} htmlFor="note">
                      {CONTACT.fields.note}{" "}
                      <span className="text-silver/30">(optional)</span>
                    </label>
                    <textarea
                      id="note"
                      name="note"
                      rows={4}
                      placeholder="Mandate objectives, timeline, jurisdiction…"
                      className={cn(inputClass, "resize-none")}
                    />
                  </div>

                  <Button type="submit" variant="primary" full disabled={status === "submitting"}>
                    {status === "submitting" ? "Submitting…" : CONTACT.submit}
                  </Button>

                  <p className="text-center text-[0.62rem] uppercase tracking-[0.2em] text-silver/35">
                    Secure intake · {CONTACT_INBOX}
                  </p>
                  <p
                    aria-live="polite"
                    className={cn(
                      "min-h-4 text-center text-xs",
                      status === "error" && "text-loss",
                      status === "success" && "text-graph",
                      (status === "fallback" || status === "idle" || status === "submitting") &&
                        "text-silver/55",
                    )}
                  >
                    {message}
                  </p>
                </form>
              </div>
            </Spotlight>
          </Reveal>

          <Reveal delay={0.12} className="contact-aside relative z-20 h-fit self-start lg:col-span-5">
            <h3 className="font-serif text-2xl text-ghost">
              A restricted channel.
            </h3>
            <p className="mt-4 text-sm font-light leading-relaxed text-silver/75">
              Obsidian Quant does not solicit retail capital. Inquiries are
              reviewed on a limited-capacity basis and reserved for institutional
              counterparties — sovereign wealth funds, family offices, and
              qualified allocators.
            </p>

            <div className="mt-10 space-y-6">
              <div className="border-l border-gold/40 pl-5">
                <div className="text-[0.62rem] uppercase tracking-[0.24em] text-silver/55">
                  Secure Correspondence
                </div>
                <a
                  href={`mailto:${CONTACT_INBOX}`}
                  className="mt-1 block text-sm text-ghost transition-colors hover:text-gold"
                >
                  {CONTACT_INBOX}
                </a>
              </div>
              <div className="border-l border-gold/40 pl-5">
                <div className="text-[0.62rem] uppercase tracking-[0.24em] text-silver/55">
                  Presence
                </div>
                <div className="mt-1 text-sm text-ghost">
                  {BRAND.presence.join(" · ")}
                </div>
              </div>
              <div className="border-l border-gold/40 pl-5">
                <div className="text-[0.62rem] uppercase tracking-[0.24em] text-silver/55">
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
