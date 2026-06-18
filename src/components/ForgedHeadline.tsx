import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../lib/cn";
import { EASE_LUX } from "../lib/motion";

/** Gold gradient carrying a bright specular band for the periodic glint. */
const GOLD_SHIMMER =
  "linear-gradient(110deg,#8a6b30 0%,#b88a4a 26%,#e8cd8a 43%,#fff6df 50%,#e8cd8a 57%,#b88a4a 74%,#8a6b30 100%)";

type Props = {
  className?: string;
  /** Seconds before "Forged in" enters; "Precision." forges a beat later. */
  delay?: number;
};

/**
 * Hero headline. "Forged in" rises in cleanly; then "Precision." is FORGED —
 * it wipes in left-to-right out of a molten-gold glow that cools to gold, with
 * a spark burst from the word, and afterward catches a slow specular glint.
 */
const ForgedHeadline = ({ className, delay = 1.7 }: Props) => {
  const reduce = useReducedMotion();
  const pDelay = delay + 0.6; // "Precision." forges after "Forged in" lands

  const sparks = useMemo(
    () =>
      Array.from({ length: 22 }, () => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
        const dist = 70 + Math.random() * 210;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          dur: 1.1 + Math.random() * 1.1,
          d: Math.random() * 0.3,
          size: 2 + Math.random() * 2.4,
        };
      }),
    [],
  );

  const embers = useMemo(
    () =>
      Array.from({ length: 8 }, () => ({
        left: `${40 + Math.random() * 55}%`,
        size: 1.5 + Math.random() * 2,
        rise: 110 + Math.random() * 140,
        op: 0.2 + Math.random() * 0.3,
        dur: 4 + Math.random() * 3,
        gap: 1.5 + Math.random() * 4,
        d: Math.random() * 4,
      })),
    [],
  );

  if (reduce) {
    return (
      <h1 className={cn("text-display text-5xl text-ghost md:text-7xl lg:text-8xl", className)}>
        Forged in <span className="text-gold-gradient">Precision.</span>
      </h1>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* embers rising from the forged word */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-2 z-0">
        {embers.map((e, i) => (
          <motion.span
            key={`e${i}`}
            className="absolute bottom-0 block rounded-full"
            style={{ left: e.left, width: e.size, height: e.size, background: "#e8b766", filter: "blur(0.4px)" }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, e.op, 0], y: [0, -e.rise] }}
            transition={{ delay: pDelay + 0.6 + e.d, duration: e.dur, repeat: Infinity, repeatDelay: e.gap, ease: "easeOut" }}
          />
        ))}
      </span>

      {/* heat flash centred on "Precision." */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-[64%] top-1/2 z-0 h-[150%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,196,110,0.55), rgba(255,140,40,0.18) 45%, transparent 72%)",
          filter: "blur(12px)",
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.2, 1.7] }}
        transition={{ delay: pDelay, duration: 1.3, times: [0, 0.32, 1], ease: "easeOut" }}
      />

      {/* spark shower off the word */}
      <span aria-hidden className="pointer-events-none absolute left-[64%] top-[55%] z-10">
        {sparks.map((s, i) => (
          <motion.span
            key={`s${i}`}
            className="absolute block rounded-full"
            style={{ width: s.size, height: s.size, background: "#ffd591", boxShadow: "0 0 7px 1px rgba(255,150,40,0.9)" }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: [0, 1, 1, 0], x: [0, s.x, s.x * 1.12], y: [0, s.y, s.y * 0.32], scale: [1, 1, 0.3] }}
            transition={{ delay: pDelay + s.d, duration: s.dur, ease: "easeOut" }}
          />
        ))}
      </span>

      <h1 className="relative z-10 text-display text-5xl text-ghost md:text-7xl lg:text-8xl">
        {/* "Forged in" rises in cleanly */}
        <motion.span
          className="inline-block"
          initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay, duration: 1.2, ease: EASE_LUX }}
        >
          Forged in
        </motion.span>{" "}
        {/* "Precision." is forged — molten wipe L→R that cools to gold */}
        <motion.span
          className="inline-block"
          style={{
            backgroundImage: GOLD_SHIMMER,
            backgroundSize: "250% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
          initial={{
            clipPath: "inset(0 102% 0 0)",
            backgroundPosition: "120% 50%",
            filter: "drop-shadow(0 0 0px rgba(255,150,40,0))",
          }}
          animate={{
            clipPath: "inset(0 0% 0 0)",
            backgroundPosition: ["120% 50%", "-60% 50%"],
            filter: [
              "drop-shadow(0 0 0px rgba(255,150,40,0))",
              "drop-shadow(0 0 32px rgba(255,150,40,0.95))",
              "drop-shadow(0 0 15px rgba(212,175,55,0.55))",
              "drop-shadow(0 0 0px rgba(212,175,55,0))",
            ],
          }}
          transition={{
            clipPath: { delay: pDelay, duration: 1.05, ease: EASE_LUX },
            filter: { delay: pDelay, duration: 1.8, times: [0, 0.14, 0.5, 1], ease: "easeOut" },
            backgroundPosition: {
              delay: pDelay + 1.7,
              duration: 1.9,
              repeat: Infinity,
              repeatDelay: 6,
              ease: "easeInOut",
            },
          }}
        >
          Precision.
        </motion.span>
      </h1>
    </div>
  );
};

export default ForgedHeadline;
