import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { BRAND, NAV, LEGAL } from "../content/site";

const Footer = () => (
  <footer className="relative border-t border-gold/10 bg-obsidian">
    <div className="mx-auto max-w-7xl px-6 py-20 lg:px-16">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
        {/* Brand */}
        <div className="md:col-span-5">
          <Logo size={40} />
          <p className="mt-6 max-w-sm text-sm font-light leading-relaxed text-silver/55">
            {BRAND.intro}
          </p>
          <p className="mt-6 font-serif text-lg italic text-silver/70">
            “{BRAND.slogan}”
          </p>
        </div>

        {/* Navigate */}
        <div className="md:col-span-3 md:col-start-7">
          <h4 className="eyebrow mb-5">Navigate</h4>
          <ul className="space-y-3 text-sm text-silver/65">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="transition-colors hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Inquire */}
        <div className="md:col-span-3">
          <h4 className="eyebrow mb-5">Inquire Securely</h4>
          <a
            href={`mailto:${BRAND.email}`}
            className="text-sm text-silver/65 transition-colors hover:text-gold"
          >
            {BRAND.email}
          </a>
          <Link
            to="/investor"
            className="mt-3 block text-sm text-silver/65 transition-colors hover:text-gold"
          >
            Member Login
          </Link>
          <p className="mt-4 text-[0.7rem] uppercase tracking-[0.22em] text-silver/40">
            {BRAND.presence.join(" · ")}
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-block border-b border-gold/40 pb-1 text-[0.7rem] uppercase tracking-[0.22em] text-gold transition-colors hover:border-gold"
          >
            Request Access →
          </Link>
        </div>
      </div>

      {/* Legal */}
      <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-gold/10 pt-8 text-[0.66rem] uppercase tracking-[0.22em] text-silver/40 md:flex-row">
        <p>© 2026 {BRAND.name}. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LEGAL.map((item) => (
            <Link key={item} to="#" className="transition-colors hover:text-gold">
              {item}
            </Link>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
