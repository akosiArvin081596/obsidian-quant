import Link from "next/link";
import Logo from "../components/Logo";
import NewsletterSignup from "../components/NewsletterSignup";
import { BRAND, LEGAL } from "../content/site";

const groups = [
  {
    title: "Company",
    links: [["The Firm", "/firm"], ["Architecture", "/architecture"], ["Contact", "/contact"]],
  },
  {
    title: "Strategies",
    links: [["Systematic Approach", "/strategy"], ["Mandate Coverage", "/strategy"], ["Risk Discipline", "/architecture"]],
  },
  {
    title: "Resources",
    links: [
      ["Blog", "/blog"],
      ["Member Area", "/investor"],
    ],
  },
] as const;

const Footer = () => (
  <footer className="site-footer relative z-10 border-t border-gold/10 bg-ink">
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-14 sm:grid-cols-2 sm:gap-12 sm:px-6 lg:grid-cols-[1.5fr_repeat(4,1fr)] lg:gap-10 lg:px-16">
      <div>
        <Logo size={40} />
        <p className="mt-6 max-w-sm text-xs font-light leading-relaxed text-silver/55">{BRAND.intro}</p>
        <p className="mt-6 font-serif text-lg italic text-silver/70">“{BRAND.slogan}”</p>
      </div>

      {groups.map((group) => (
        <div key={group.title}>
          <h4 className="mb-4 text-[.66rem] uppercase tracking-[.2em] text-gold sm:mb-5">{group.title}</h4>
          <ul className="text-xs text-silver/65">
            {group.links.map(([label, to]) => (
              <li key={label}>
                <Link
                  href={to}
                  className="inline-flex min-h-11 items-center transition-colors hover:text-gold"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div>
        <h4 className="mb-4 text-[.66rem] uppercase tracking-[.2em] text-gold sm:mb-5">Contact</h4>
        <a
          href={`mailto:${BRAND.email}`}
          className="inline-block max-w-full break-words text-xs text-silver/65 transition-colors hover:text-gold sm:whitespace-nowrap sm:break-normal"
        >
          {BRAND.email}
        </a>
        <p className="mt-4 text-[.65rem] uppercase leading-relaxed tracking-[.18em] text-silver/40">
          {BRAND.presence.join(" · ")}
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-flex min-h-11 items-center border-b border-gold/40 text-[.65rem] uppercase tracking-[.2em] text-gold hover:border-gold"
        >
          Request Access →
        </Link>
        <NewsletterSignup />
      </div>
    </div>

    <div className="border-t border-gold/10 bg-[#030507]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 py-5 text-center sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4 md:text-left lg:px-16">
        <div className="space-y-2">
          <p className="text-[.6rem] uppercase tracking-[.2em] text-silver/40">
            © 2026 {BRAND.name}. All rights reserved.
          </p>
          <p className="text-[.65rem] leading-relaxed text-silver/45">
            {BRAND.relationship}
          </p>
          <p className="text-[.65rem] leading-relaxed text-silver/45">
            Developed and designed by{" "}
            <a
              href="https://alchemydev.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-silver/70 transition-colors hover:text-gold"
            >
              Alchemy Dev
            </a>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 md:justify-end">
          {LEGAL.map(({ label, to }) => (
            <Link
              key={to}
              href={to}
              className="inline-flex min-h-10 items-center text-[.65rem] uppercase tracking-[.18em] text-silver/40 transition-colors hover:text-gold"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
