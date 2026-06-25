import { motion } from "framer-motion";
import { fadeUp } from "../lib/motion";

/**
 * The operational system, rendered as a vertical stack of infrastructure layers.
 * Each tier connects to the next by a hairline gold rail — an architecture
 * diagram that reads from research down to live execution.
 *
 * Microcopy is written tight + systematic to match ARCHITECTURE.body.
 */
const LAYERS = [
  {
    code: "L1",
    node: "RESEARCH_LAYER",
    title: "Research Layer",
    body: "Structural hypotheses formed from market behaviour, not narrative — across liquidity regimes and historical arbitrage horizons.",
  },
  {
    code: "L2",
    node: "MODELING_MATRIX",
    title: "Modeling Matrix",
    body: "Signals are encoded and stress-tested through non-linear modeling matrices, backtested across extreme historical paradigms.",
  },
  {
    code: "L3",
    node: "RISK_ENGINE",
    title: "Risk Engine",
    body: "Drawdown protocols size every position dynamically. The loss profile is engineered before a single basis point of return.",
  },
  {
    code: "L4",
    node: "EXECUTION_FABRIC",
    title: "Execution Fabric",
    body: "Cryptographically secured, low-latency clearing across multi-region order books — the architecture allocating with certainty.",
  },
] as const;

const ArchitectureLayers = ({ delay = 0 }: { delay?: number }) => (
  <motion.ol
    className="relative"
    variants={{
      hidden: {},
      show: { transition: { staggerChildren: 0.18, delayChildren: 0.05 + delay } },
    }}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: "-70px" }}
  >
    {/* spine rail */}
    <span
      className="pointer-events-none absolute left-[1.45rem] top-4 bottom-4 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-transparent md:left-[1.7rem]"
      aria-hidden
    />

    {LAYERS.map((layer) => (
      <motion.li key={layer.node} variants={fadeUp}>
        <div className="group relative flex gap-6 pb-6 last:pb-0 md:gap-8">
          {/* node marker */}
          <div className="relative z-10 flex-shrink-0 pt-1">
            <span className="flex h-12 w-12 items-center justify-center border border-gold/25 bg-obsidian font-mono text-[0.7rem] tracking-wider text-gold transition-colors duration-500 group-hover:border-gold/60 md:h-14 md:w-14 md:text-xs">
              {layer.code}
            </span>
          </div>

          {/* layer card */}
          <div className="flex-1 border border-gold/10 bg-midnight/40 p-6 backdrop-blur-sm transition-colors duration-500 group-hover:border-gold/25 md:p-8">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <h3 className="font-serif text-2xl text-ghost lg:text-3xl">
                {layer.title}
              </h3>
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-silver/40">
                {layer.node}_
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-xs font-light leading-relaxed text-silver/65 lg:text-sm">
              {layer.body}
            </p>
          </div>
        </div>
      </motion.li>
    ))}
  </motion.ol>
);

export default ArchitectureLayers;
