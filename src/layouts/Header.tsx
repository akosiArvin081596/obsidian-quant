import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "../components/Logo";
import Button from "../components/Button";
import { cn } from "../lib/cn";
import { NAV } from "../content/site";
import { EASE_LUX } from "../lib/motion";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-gold/10 bg-obsidian/85 py-3 backdrop-blur-md"
          : "border-b border-transparent bg-transparent py-5",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-16">
        <Link to="/" aria-label="Obsidian Quant Group — home">
          <Logo size={scrolled ? 34 : 38} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-9 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "group relative text-[0.7rem] font-medium uppercase tracking-[0.2em] transition-colors duration-300",
                  isActive ? "text-ghost" : "text-silver/70 hover:text-ghost",
                )
              }
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Button to="/contact" variant="outline" className="hidden sm:inline-flex">
            Request Access
          </Button>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span className="h-px w-6 bg-silver" />
            <span className="h-px w-6 bg-silver" />
            <span className="h-px w-4 self-end bg-gold" />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 hex-bg lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between px-6 py-5">
              <Logo size={36} />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="relative h-9 w-9"
              >
                <span className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 rotate-45 bg-gold" />
                <span className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -rotate-45 bg-gold" />
              </button>
            </div>

            <motion.nav
              className="mt-10 flex flex-col gap-2 px-8"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            >
              {NAV.map((item) => (
                <motion.div
                  key={item.to}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    show: { opacity: 1, x: 0, transition: { ease: EASE_LUX } },
                  }}
                >
                  <NavLink
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block border-b border-gold/10 py-4 font-serif text-3xl text-ghost"
                  >
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}
              <Button to="/contact" className="mt-8" onClick={() => setOpen(false)}>
                Request Access
              </Button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
