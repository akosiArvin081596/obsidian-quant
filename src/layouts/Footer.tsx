import { Link } from "react-router-dom";
import Logo from "../components/Logo";
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
    links: [["Insights", "/insights"], ["Research Notes", "/insights"], ["Member Area", "/investor"]],
  },
] as const;

const Footer = () => (
  <footer className="relative z-10 border-t border-gold/10 bg-[#05080c]">
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)] lg:gap-10 lg:px-16">
      <div>
        <Logo size={40} />
        <p className="mt-6 max-w-sm text-xs font-light leading-relaxed text-silver/55">{BRAND.intro}</p>
        <p className="mt-6 font-serif text-lg italic text-silver/70">“{BRAND.slogan}”</p>
      </div>

      {groups.map((group) => (
        <div key={group.title}>
          <h4 className="mb-5 text-[.66rem] uppercase tracking-[.2em] text-gold">{group.title}</h4>
          <ul className="space-y-3 text-xs text-silver/65">
            {group.links.map(([label, to]) => (
              <li key={label}><Link to={to} className="transition-colors hover:text-gold">{label}</Link></li>
            ))}
          </ul>
        </div>
      ))}

      <div>
        <h4 className="mb-5 text-[.66rem] uppercase tracking-[.2em] text-gold">Contact</h4>
        <a href={`mailto:${BRAND.email}`} className="text-xs text-silver/65 transition-colors hover:text-gold">{BRAND.email}</a>
        <p className="mt-4 text-[.65rem] uppercase leading-relaxed tracking-[.18em] text-silver/40">{BRAND.presence.join(" · ")}</p>
        <Link to="/contact" className="mt-6 inline-block border-b border-gold/40 pb-1 text-[.65rem] uppercase tracking-[.2em] text-gold hover:border-gold">Request Access →</Link>
      </div>
    </div>

    <div className="border-t border-gold/10 bg-[#030507]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 text-[.6rem] uppercase tracking-[.2em] text-silver/40 md:flex-row lg:px-16">
        <p>© 2026 {BRAND.name}. All rights reserved.</p>
        <div className="flex flex-wrap justify-center gap-6">{LEGAL.map((item) => <span key={item}>{item}</span>)}</div>
      </div>
    </div>
  </footer>
);

export default Footer;
