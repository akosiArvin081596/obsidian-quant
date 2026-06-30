/**
 * Global cinematic overlay — a soft edge vignette + ultra-fine film grain.
 * Fixed, purely decorative, never interactive. Mounted once per layout so it
 * seats over the whole site. Felt, not seen.
 */
const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const GrainVignette = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
    {/* edge vignette — cinematic depth */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(120% 120% at 50% 28%, transparent 52%, rgba(0,0,0,0.5) 100%)",
      }}
    />
    {/* film grain */}
    <div
      className="absolute inset-0 opacity-[0.052] mix-blend-overlay"
      style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: "120px 120px" }}
    />
  </div>
);

export default GrainVignette;
