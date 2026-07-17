import { cn } from "../lib/cn";
import ObsidianGemImage from "./ObsidianGemImage";

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
      <ObsidianGemImage
        width={size}
        height={size}
        alt={withWordmark ? "" : "Obsidian Quant Group"}
        className={cn(
          "shrink-0 object-contain drop-shadow-[0_0_8px_rgba(184,138,74,0.35)]",
          !ring && "scale-125",
        )}
      />

      {withWordmark && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="font-serif text-[1rem] font-semibold tracking-[0.14em] text-ghost sm:text-[1.15rem] sm:tracking-[0.22em]">
            OBSIDIAN
          </span>
          <span className="text-[0.55rem] font-medium tracking-[0.28em] text-gold sm:text-[0.6rem] sm:tracking-[0.42em]">
            QUANT&nbsp;GROUP
          </span>
        </span>
      )}    </span>
  );
};

export default Logo;
