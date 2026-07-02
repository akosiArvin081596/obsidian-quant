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
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <img
        src="/assets/obsidian-gem.webp"
        alt={withWordmark ? "" : "Obsidian Quant Group"}
        width={size}
        height={size}
        className={cn("shrink-0 object-contain drop-shadow-[0_0_8px_rgba(184,138,74,0.35)]", !ring && "scale-125")}
      />

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
