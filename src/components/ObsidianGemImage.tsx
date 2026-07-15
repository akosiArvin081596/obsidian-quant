import type { CSSProperties } from "react";

type Props = {
  className?: string;
  /** Prefer eager load for the persistent traveling gem. */
  priority?: boolean;
  width?: number;
  height?: number;
  alt?: string;
  style?: CSSProperties;
};

/**
 * Shared gem asset with WebP + PNG fallback so older browsers /
 * locked-down environments still see the stone when WebP fails.
 */
const ObsidianGemImage = ({
  className,
  priority = false,
  width,
  height,
  alt = "",
  style,
}: Props) => (
  <picture>
    <source srcSet="/assets/obsidian-gem.webp" type="image/webp" />
    <img
      src="/assets/obsidian-gem.png"
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : undefined}
      draggable={false}
    />
  </picture>
);

export default ObsidianGemImage;
