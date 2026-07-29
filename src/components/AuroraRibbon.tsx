"use client";

import { useId } from "react";
import { cn } from "../lib/cn";

type AuroraRibbonProps = {
  className?: string;
  /** 0–1 overall opacity of the ribbon. */
  intensity?: number;
};

/**
 * The brand's blue→violet light-ribbon — a sweeping arc of blurred light.
 * Built from layered SVG arcs (gradient stroke + gaussian blur) over a glow.
 * Purely decorative.
 */
const AuroraRibbon = ({ className, intensity = 1 }: AuroraRibbonProps) => {
  const id = useId().replace(/:/g, "");

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden
      style={{ opacity: intensity }}
    >
      {/* Soft glow bloom behind the streaks */}
      <div
        className="animate-aurora absolute right-[-15%] top-1/2 h-[120%] w-[70%] -translate-y-1/2"
        style={{
          background:
            "radial-gradient(closest-side, rgba(37,99,235,0.28), rgba(124,58,237,0.16) 55%, transparent 75%)",
          filter: "blur(40px)",
        }}
      />
      <svg
        className="absolute right-[-6%] top-1/2 h-[150%] w-[85%] -translate-y-1/2"
        viewBox="0 0 600 600"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={`aur-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0" />
            <stop offset="35%" stopColor="#2563eb" />
            <stop offset="60%" stopColor="#7c3aed" />
            <stop offset="85%" stopColor="#c026d3" />
            <stop offset="100%" stopColor="#c026d3" stopOpacity="0" />
          </linearGradient>
          <filter id={`blur-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id={`soft-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        <g filter={`url(#blur-${id})`} className="animate-aurora">
          <path
            d="M520 40 C 360 150, 300 320, 470 560"
            stroke={`url(#aur-${id})`}
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d="M560 70 C 410 170, 350 350, 520 580"
            stroke={`url(#aur-${id})`}
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>
        {/* bright cores */}
        <g filter={`url(#soft-${id})`}>
          <path
            d="M540 55 C 388 160, 326 332, 496 568"
            stroke={`url(#aur-${id})`}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};

export default AuroraRibbon;
