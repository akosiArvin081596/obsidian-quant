import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../lib/cn";
import { EASE_LUX } from "../lib/motion";

/** Gold gradient carrying a bright specular band for the periodic glint. */
const GOLD_SHIMMER =
  "linear-gradient(110deg,#8a6b30 0%,#b88a4a 26%,#e8cd8a 43%,#fff6df 50%,#e8cd8a 57%,#b88a4a 74%,#8a6b30 100%)";

type Props = {
  className?: string;
  /** Seconds before the forge "strike" fires (sync with the preloader lift). */
  delay?: number;
};

/**
 * The hero headline, forged. On entrance the words strike in with a heat
 * flash + spark shower and a molten glow that slowly cools from ember to gold;
 * "Precision." then catches a light glint on a slow loop, and embers drift up.
 */
const ForgedHeadline = ({ className, delay = 1.7 }: Props) => {
  const reduce = useReducedMotion();

  const sparks = useMemo(
    () =>
      Array.from({ length: 24 }, () => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.35;
        const dist = 90 + Math.random() * 260;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          dur: 1.4 + Math.random() * 1.4,
          d: Math.random() * 0.4,
          size: 2 + Math.random() * 2.6,
        };
      }),
    [],
  );

  const embers = useMemo(
    () =>
      Array.from({ length: 9 }, () => ({
        left: `${8 + Math.random() * 84}%`,
        size: 1.5 + Math.random() * 2,
        rise: 110 + Math.random() * 150,
        op: 0.2 + Math.random() * 0.32,
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
      {/* lingering embers rising from the forge */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-2 z-0">
        {embers.map((e, i) => (
          <motion.span
            key={`e${i}`}
            className="absolute bottom-0 block rounded-full"
            style={{
              left: e.left,
              width: e.size,
              height: e.size,
              background: "#e8b766",
              filter: "blur(0.4px)",
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, e.op, 0], y: [0, -e.rise] }}
            transition={{
              delay: delay + 1.4 + e.d,
              duration: e.dur,
              repeat: Infinity,
              repeatDelay: e.gap,
              ease: "easeOut",
            }}
          />
        ))}
      </span>

      {/* heat flash on strike */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[130%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,196,110,0.6), rgba(255,140,40,0.2) 45%, transparent 72%)",
          filter: "blur(12px)",
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.95, 0], scale: [0.5, 1.25, 1.8] }}
        transition={{ delay, duration: 1.5, times: [0, 0.32, 1], ease: "easeOut" }}
      />

      {/* spark shower — arcs out, peaks, falls, fades */}
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-[62%] z-10">
        {sparks.map((s, i) => (
          <motion.span
            key={`s${i}`}
            className="absolute block rounded-full"
            style={{
              width: s.size,
              height: s.size,
              background: "#ffd591",
              boxShadow: "0 0 7px 1px rgba(255,150,40,0.9)",
            }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [0, s.x, s.x * 1.14],
              y: [0, s.y, s.y * 0.32],
              scale: [1, 1, 0.3],
            }}
            transition={{ delay: delay + s.d, duration: s.dur, ease: "easeOut" }}
          />
        ))}
      </span>

      {/* the headline — strikes in molten, cools slowly to gold */}
      <motion.h1
        className="relative z-10 text-display text-5xl text-ghost md:text-7xl lg:text-8xl"
        initial={{ opacity: 0, y: 34, scale: 1.09, filter: "blur(16px)" }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          textShadow: [
            "0 0 0px rgba(255,150,40,0)",
            "0 0 44px rgba(255,150,40,0.98), 0 0 90px rgba(255,90,20,0.55)",
            "0 0 20px rgba(212,175,55,0.5)",
            "0 0 0px rgba(212,175,55,0)",
          ],
        }}
        transition={{
          delay,
          duration: 1.9,
          ease: EASE_LUX,
          textShadow: { delay, duration: 3.6, times: [0, 0.1, 0.5, 1], ease: "easeOut" },
        }}
      >
        Forged in{" "}
        <motion.span
          style={{
            backgroundImage: GOLD_SHIMMER,
            backgroundSize: "250% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
          initial={{ backgroundPosition: "120% 50%" }}
          animate={{ backgroundPosition: ["120% 50%", "-60% 50%"] }}
          transition={{
            delay: delay + 3.2,
            duration: 1.9,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 6.5,
          }}
        >
          Precision.
        </motion.span>
      </motion.h1>
    </div>
  );
};

export default ForgedHeadline;
