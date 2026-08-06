import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "../lib/cn";
import { toPublicHref } from "../lib/routes";

type Variant = "primary" | "outline" | "ghost";

type ButtonProps = {
  children: ReactNode;
  variant?: Variant;
  /** Internal route → renders a Next.js Link. */
  to?: string;
  /** External / anchor link. */
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  full?: boolean;
  disabled?: boolean;
  className?: string;
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "btn-sheen bg-gold text-obsidian hover:bg-warm-gold hover:-translate-y-0.5 shadow-[0_14px_40px_-16px_rgba(184,138,74,0.7)] hover:shadow-[0_20px_52px_-14px_rgba(212,175,55,0.85)]",
  outline:
    "border border-gold text-gold hover:bg-gold hover:text-obsidian",
  ghost:
    "border border-silver/20 text-ghost hover:border-gold hover:text-gold",
};

const BASE =
  "inline-flex items-center justify-center gap-2.5 rounded-none px-5 py-3.5 text-center text-[0.65rem] font-semibold uppercase leading-snug tracking-[0.16em] transition-all duration-300 ease-out sm:px-7 sm:text-[0.7rem] sm:tracking-[0.22em]";

/** Brand button — sharp-cornered, uppercase, gold. Polymorphic (Link / a / button). */
const Button = ({
  children,
  variant = "primary",
  to,
  href,
  onClick,
  type = "button",
  full,
  disabled = false,
  className,
}: ButtonProps) => {
  const classes = cn(
    BASE,
    VARIANTS[variant],
    full && "w-full",
    disabled && "pointer-events-none opacity-50",
    className,
  );

  if (to) {
    return (
      <Link href={toPublicHref(to)} className={classes} onClick={onClick} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick} aria-disabled={disabled}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
