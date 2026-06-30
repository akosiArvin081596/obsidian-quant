import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Eyebrow from "../../components/Eyebrow";
import GoldRule from "../../components/GoldRule";
import Spotlight from "../../components/Spotlight";
import SampleDataBadge from "./SampleDataBadge";
import { useSession } from "./session-context";
import { DOCUMENTS, MANDATE, RELATIONSHIP } from "./mockData";

/** Small download glyph for the (inert, illustrative) document controls. */
const DownloadIcon = () => (
  <svg
    viewBox="0 0 16 16"
    className="h-3.5 w-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M8 2.5v7" />
    <path d="M4.75 6.25 8 9.5l3.25-3.25" />
    <path d="M3 13h10" />
  </svg>
);

/** Member account — identity, dedicated coverage, documents + sign-out (mockup). */
const Account = () => {
  const navigate = useNavigate();
  const { memberId, signOut } = useSession();
  const [docNotice, setDocNotice] = useState(false);

  const onSignOut = () => {
    signOut();
    navigate("/investor/login");
  };

  const identity = [
    { k: "Member ID", v: memberId || "—", mono: true },
    { k: "Access Tier", v: "Mandate / Private" },
    { k: "Session", v: "Active · monitored", tone: "graph" as const },
    { k: "Primary Contact", v: "Relationship desk" },
  ];

  const coverage = [
    { k: "Secure contact", v: RELATIONSHIP.email, mono: true },
    { k: "Next portfolio review", v: MANDATE.nextReview },
  ];

  return (
    <div>
      <header className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        {/* faint ambient bloom behind the header */}
        <div
          aria-hidden
          className="gold-bloom pointer-events-none absolute -left-16 -top-20 z-[-1] h-[18rem] w-[18rem] opacity-50"
        />
        <div className="max-w-2xl">
          <Eyebrow index="03">Account</Eyebrow>
          <h1 className="mt-5 text-display text-4xl text-ghost lg:text-5xl">
            Membership & access.
          </h1>
          <p className="mt-4 text-sm font-light leading-relaxed text-silver/60">
            Your member identity, dedicated coverage and document vault. Details
            and statements are illustrative here, shown to demonstrate the
            private-client experience.
          </p>
        </div>
        <SampleDataBadge className="shrink-0" />
      </header>

      <GoldRule className="my-10" />

      {/* ============ IDENTITY + RELATIONSHIP ============ */}
      <section aria-label="Membership and relationship">
        {/* very faint cursor spotlight drifting across the two cards */}
        <Spotlight className="grid gap-6 lg:grid-cols-2" size={420} strength={0.08}>
          {/* Membership identity */}
          <div className="relative overflow-hidden border border-gold/10 bg-midnight/40 p-6 gold-grid lg:p-8">
            <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold">
              Membership
            </div>
            <dl className="mt-5 divide-y divide-silver/5">
              {identity.map((row) => (
                <div
                  key={row.k}
                  className="flex items-center justify-between gap-6 py-3.5"
                >
                  <dt className="text-[0.62rem] font-medium uppercase tracking-[0.22em] text-silver/45">
                    {row.k}
                  </dt>
                  <dd
                    className={`text-sm ${row.mono ? "font-mono" : "font-light"} ${
                      row.tone === "graph" ? "text-graph" : "text-ghost"
                    }`}
                  >
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Relationship & coverage */}
          <div className="relative overflow-hidden border border-gold/10 bg-midnight/40 p-6 gold-grid lg:p-8">
            <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold">
              Relationship & coverage
            </div>
            <div className="mt-5">
              <div className="font-serif text-xl text-ghost">
                {RELATIONSHIP.manager}
              </div>
              <div className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-silver/50">
                {RELATIONSHIP.title}
              </div>
            </div>
            <dl className="mt-6 divide-y divide-silver/5 border-t border-silver/5">
              {coverage.map((row) => (
                <div
                  key={row.k}
                  className="flex items-center justify-between gap-6 py-3.5"
                >
                  <dt className="text-[0.62rem] font-medium uppercase tracking-[0.22em] text-silver/45">
                    {row.k}
                  </dt>
                  <dd
                    className={`text-sm text-ghost ${
                      row.mono ? "font-mono" : "font-light"
                    }`}
                  >
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-[0.66rem] font-light leading-relaxed text-silver/45">
              Your dedicated coverage for mandate queries, reporting and reviews.
              Contact details are illustrative in this sample environment.
            </p>
          </div>
        </Spotlight>
      </section>

      {/* ============ DOCUMENTS & STATEMENTS ============ */}
      <section className="mt-12" aria-label="Documents and statements">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-ghost">
            Documents & statements
          </h2>
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-silver/40">
            Secure vault · sample
          </span>
        </div>
        <GoldRule className="mt-5" diamond={false} />

        <ul className="mt-2">
          {DOCUMENTS.map((doc) => (
            <li
              key={doc.title}
              className="flex flex-col gap-4 border-b border-silver/5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-silver/45 sm:w-20">
                  {doc.date}
                </span>
                <span className="inline-flex w-fit items-center gap-2 border border-gold/20 px-2.5 py-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.18em] text-gold">
                  <span className="h-1 w-1 rotate-45 bg-gold" aria-hidden />
                  {doc.kind}
                </span>
                <span className="text-sm font-light text-ghost">{doc.title}</span>
              </div>
              <div className="flex items-center gap-4 self-start sm:self-auto">
                <span className="font-mono text-[0.56rem] uppercase tracking-[0.18em] text-silver/40">
                  {doc.format}
                </span>
                <button
                  type="button"
                  onClick={() => setDocNotice(true)}
                  aria-label={`Download ${doc.title} — illustrative sample`}
                  className="inline-flex items-center gap-2 border border-silver/20 px-3 py-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-silver/70 transition-colors hover:border-gold hover:text-gold"
                >
                  <DownloadIcon />
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>

        <p
          aria-live="polite"
          className="mt-5 min-h-[1.1rem] text-[0.66rem] font-light text-silver/45"
        >
          {docNotice &&
            "Sample environment — documents are illustrative and cannot be downloaded."}
        </p>
      </section>

      {/* ============ SIGN OUT ============ */}
      <div className="mt-12 flex flex-col items-start gap-4 border-t border-gold/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.66rem] font-light text-silver/45">
          Ending your session returns you to the sign-in gateway.
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="border border-silver/20 px-6 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-ghost transition-colors hover:border-gold hover:text-gold"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default memo(Account);
