import { useId } from "react";
import { cn } from "../lib/cn";

type LogoProps = {
  /** Pixel size of the crystal mark. */
  size?: number;
  /** Show the "OBSIDIAN QUANT" wordmark beside the mark. */
  withWordmark?: boolean;
  /** Draw the enclosing gold ring. */
  ring?: boolean;
  className?: string;
};

/**
 * The Obsidian Quant mark: a faceted obsidian crystal enclosed in a gold ring.
 * Geometry + metallic gradients follow the brand "Logo Analysis" guidance.
 */
const Logo = ({
  size = 38,
  withWordmark = true,
  ring = true,
  className,
}: LogoProps) => {
  const id = useId().replace(/:/g, "");

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role="img"
        aria-label="Obsidian Quant Group"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8CD8A" />
            <stop offset="45%" stopColor="#B88A4A" />
            <stop offset="100%" stopColor="#7A5C30" />
          </linearGradient>
          <linearGradient id={`faceL-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D7DBE0" />
            <stop offset="40%" stopColor="#737C88" />
            <stop offset="100%" stopColor="#161E29" />
          </linearGradient>
          <linearGradient id={`faceR-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#566069" />
            <stop offset="55%" stopColor="#1B2430" />
            <stop offset="100%" stopColor="#0B0D12" />
          </linearGradient>
        </defs>

        {ring && (
          <>
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke={`url(#ring-${id})`}
              strokeWidth="3"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#B88A4A"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
          </>
        )}

        {/* Faceted crystal */}
        <polygon points="50,19 36,41 50,52" fill={`url(#faceL-${id})`} />
        <polygon points="50,19 64,41 50,52" fill={`url(#faceR-${id})`} />
        <polygon points="36,41 41,63 50,85 50,52" fill={`url(#faceL-${id})`} />
        <polygon points="64,41 59,63 50,85 50,52" fill={`url(#faceR-${id})`} />
        <polygon
          points="50,19 64,41 59,63 50,85 41,63 36,41"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M50,19 L50,85 M36,41 L50,52 L64,41"
          stroke="#D4AF37"
          strokeOpacity="0.85"
          strokeWidth="0.9"
          fill="none"
        />
      </svg>

      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-[1.15rem] font-semibold tracking-[0.22em] text-ghost">
            OBSIDIAN
          </span>
          <span className="text-[0.6rem] font-medium tracking-[0.42em] text-gold">
            QUANT&nbsp;GROUP
          </span>
        </span>
      )}
    </span>
  );
};

export default Logo;
