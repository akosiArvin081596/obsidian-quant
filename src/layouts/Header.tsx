"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "../components/Logo";
import Button from "../components/Button";
import { cn } from "../lib/cn";
import { isActivePath, toPublicHref } from "../lib/routes";
import { NAV } from "../content/site";
import { EASE_LUX } from "../lib/motion";

const Header = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        open
          ? "border-b border-gold/10 bg-obsidian py-3"
          : scrolled
            ? "border-b border-gold/10 bg-obsidian/95 py-3 backdrop-blur-md"
            : "border-b border-transparent bg-transparent py-5",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-16">
        <Link href="/" aria-label="Obsidian Quant Group — home">
          <Logo size={scrolled || open ? 34 : 38} />
        </Link>

        <nav className="hidden items-center gap-9 lg:flex">
          {NAV.map((item) => {
            const isActive = isActivePath(pathname, item.to);
            return (
              <Link
                key={item.to}
                href={toPublicHref(item.to)}
                className={cn(
                  "group relative text-[0.7rem] font-medium uppercase tracking-[0.2em] transition-colors duration-300",
                  isActive ? "text-ghost" : "text-silver/70 hover:text-ghost",
                )}
              >
                {item.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex">
            <Button to="/contact" variant="outline">
              Request Access
            </Button>
          </span>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span className="h-px w-6 bg-silver" />
            <span className="h-px w-6 bg-silver" />
            <span className="h-px w-4 self-end bg-gold" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-obsidian lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              aria-hidden
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cpath fill='%23111A28' fill-opacity='0.55' fill-rule='evenodd' d='M13.99 9.25l13 7.5v15l-13 7.5-13-7.5v-15l13-7.5zM0 0h28v4.9L13.99 13 0 4.9V0zm0 49h28v-4.9L13.99 36 0 44.1V49z'/%3E%3C/svg%3E\")",
              }}
            />

            <div className="relative z-10 flex items-center justify-between border-b border-gold/10 px-5 py-4 sm:px-6">
              <Logo size={34} />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="relative flex h-11 w-11 items-center justify-center"
              >
                <span className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 rotate-45 bg-gold" />
                <span className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -rotate-45 bg-gold" />
              </button>
            </div>

            <motion.nav
              className="relative z-10 flex flex-1 flex-col gap-1 overflow-y-auto px-5 pb-10 pt-6 sm:px-8"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            >
              {NAV.map((item) => (
                <motion.div
                  key={item.to}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0, transition: { ease: EASE_LUX } },
                  }}
                >
                  <Link
                    href={toPublicHref(item.to)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block border-b border-gold/10 py-4 font-serif text-3xl text-ghost transition-colors sm:text-4xl",
                      isActivePath(pathname, item.to) ? "text-gold" : undefined,
                    )}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                className="mt-8"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { ease: EASE_LUX } },
                }}
              >
                <Button to="/contact" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
                  Request Access
                </Button>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
