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
  parseContactForm,
  submitContactRequest,
} from "../lib/contact";

const inputClass =
  "w-full rounded-none border border-gold/20 bg-midnight/70 px-4 py-3.5 text-sm text-ghost placeholder:text-silver/30 transition-colors focus:border-gold focus:outline-none";
const labelClass =
  "mb-2 block text-[0.62rem] font-medium uppercase tracking-[0.24em] text-silver/55";

type Status = "idle" | "submitting" | "success" | "fallback" | "error";
type SubmittedSnapshot = {
  name: string;
  email: string;
  profile: string;
};

const Contact = () => {
  const [profile, setProfile] = useState<string>(CONTACT_PROFILES[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [mailtoHref, setMailtoHref] = useState("");
  const [submitted, setSubmitted] = useState<SubmittedSnapshot | null>(null);

  const showOther = isOthersProfile(profile);
  const showConfirmation = status === "success" || status === "fallback";

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    if (!formEl.reportValidity()) return;

    const submission = parseContactForm(new FormData(formEl));
    setStatus("submitting");
    setMessage("");
    setMailtoHref("");
    setSubmitted(null);

    const result = await submitContactRequest(new FormData(formEl));

    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }

    if (result.mailtoFallback) {
      setStatus("fallback");
      setMailtoHref(result.mailto);
      setSubmitted({
        name: submission.name,
        email: submission.email,
        profile: submission.profileOther || submission.profile,
      });
      setMessage(
        "We prepared a backup email draft because the secure intake service did not confirm delivery.",
      );
      return;
    }

    setStatus("success");
    setSubmitted({
      name: submission.name,
      email: submission.email,
      profile: submission.profileOther || submission.profile,
    });
    setMessage(
      "Your request has been received. Our team will review it and respond with next steps through the secure channel.",
    );
    formEl.reset();
    setProfile(CONTACT_PROFILES[0]);
  };

  const resetForm = () => {
    setStatus("idle");
    setMessage("");
    setMailtoHref("");
    setSubmitted(null);
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
                {showConfirmation ? (
                  <div
                    aria-live="polite"
                    className="space-y-6 border border-gold/20 bg-midnight/60 p-6 text-sm text-silver/78"
                  >
                    <div>
                      <p className="text-[0.62rem] uppercase tracking-[0.24em] text-gold/80">
                        {status === "success" ? "Request Received" : "Action Required"}
                      </p>
                      <h3 className="mt-3 font-serif text-2xl text-ghost">
                        {status === "success"
                          ? "Confirmation sent to this page."
                          : "Finish sending the backup email."}
                      </h3>
                      <p className="mt-3 leading-relaxed">{message}</p>
                    </div>

                    {submitted && (
                      <div className="grid gap-4 border border-gold/10 bg-obsidian/45 p-5 sm:grid-cols-2">
                        <div>
                          <div className="text-[0.62rem] uppercase tracking-[0.2em] text-silver/40">
                            Contact
                          </div>
                          <div className="mt-1 text-ghost">{submitted.name}</div>
                        </div>
                        <div>
                          <div className="text-[0.62rem] uppercase tracking-[0.2em] text-silver/40">
                            Reply Email
                          </div>
                          <div className="mt-1 text-ghost">{submitted.email}</div>
                        </div>
                        <div>
                          <div className="text-[0.62rem] uppercase tracking-[0.2em] text-silver/40">
                            Counterparty Profile
                          </div>
                          <div className="mt-1 text-ghost">{submitted.profile}</div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 text-silver/72">
                      {status === "success" ? (
                        <p>
                          Next step: our team will review your submission and reply from{" "}
                          <span className="text-ghost">{CONTACT_INBOX}</span> with any
                          follow-up instructions.
                        </p>
                      ) : (
                        <>
                          <p>
                            We could not verify the secure handoff automatically. Open the
                            prepared message below, then send it from your email client so
                            your request still reaches <span className="text-ghost">{CONTACT_INBOX}</span>.
                          </p>
                          <Button href={mailtoHref} variant="primary" full>
                            Open Backup Email Draft
                          </Button>
                        </>
                      )}
                    </div>

                    <Button type="button" variant="outline" full onClick={resetForm}>
                      Submit Another Request
                    </Button>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={onSubmit} noValidate={false}>
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
                        (status === "idle" || status === "submitting") && "text-silver/55",
                      )}
                    >
                      {message}
                    </p>
                  </form>
                )}
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
