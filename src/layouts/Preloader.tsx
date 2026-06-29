import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Logo from "../components/Logo";
import { EASE_LUX } from "../lib/motion";

/** Hammer-strike moments (seconds). */
const STRIKES = [0.55, 0.95, 1.4];
const GEM = 96;

/* Spark-shower geometry — random values fixed once at module load so the
   component renders purely (a one-shot forge curtain; identical each mount). */
const SPARKS = Array.from({ length: 28 }, (_, i) => {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.3;
  const dist = 55 + Math.random() * 150;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    dur: 0.7 + Math.random() * 0.8,
    begin: STRIKES[i % STRIKES.length] + Math.random() * 0.1,
    size: 1.6 + Math.random() * 2.4,
  };
});

/**
 * Forge curtain — the obsidian gem is forged: it heats in the hearth, takes
 * three hammer strikes (flash + spark shower), the molten glow tempers to
 * gold, and the ring sets around the crystal before the curtain lifts.
 */
const Preloader = () => {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), reduce ? 650 : 2150);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-obsidian"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE_LUX }}
        >
          <div className="relative flex flex-col items-center">
            {/* gem zone */}
            <div className="relative flex items-center justify-center">
              {/* hearth glow */}
              {!reduce && (
                <motion.div
                  className="pointer-events-none absolute h-72 w-72 rounded-full"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(255,130,30,0.5), rgba(255,90,20,0.12) 50%, transparent 72%)",
                    filter: "blur(22px)",
                  }}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: [0, 0.6, 0.9, 0.4, 0], scale: [0.7, 1, 1.12, 1, 0.9] }}
                  transition={{ duration: 2.1, times: [0, 0.25, 0.55, 0.82, 1], ease: "easeOut" }}
                />
              )}

              {/* strike flashes */}
              {!reduce &&
                STRIKES.map((tStrike, i) => (
                  <motion.span
                    key={`f${i}`}
                    aria-hidden
                    className="pointer-events-none absolute h-44 w-44 rounded-full"
                    style={{
                      background:
                        "radial-gradient(closest-side, rgba(255,214,150,0.85), transparent 70%)",
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 0.85, 0], scale: [0.5, 1.4, 1.75] }}
                    transition={{ delay: tStrike, duration: 0.5, times: [0, 0.28, 1], ease: "easeOut" }}
                  />
                ))}

              {/* spark shower */}
              {!reduce && (
                <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
                  {SPARKS.map((s, i) => (
                    <motion.span
                      key={`s${i}`}
                      className="absolute block rounded-full"
                      style={{
                        width: s.size,
                        height: s.size,
                        background: "#ffd591",
                        boxShadow: "0 0 6px 1px rgba(255,150,40,0.9)",
                      }}
                      initial={{ opacity: 0, x: 0, y: 0, scale: 1 }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        x: [0, s.x, s.x * 1.12],
                        y: [0, s.y, s.y * 0.4],
                        scale: [1, 1, 0.25],
                      }}
                      transition={{ delay: s.begin, duration: s.dur, ease: "easeOut" }}
                    />
                  ))}
                </span>
              )}

              {/* the gem — heats, gets struck, tempers */}
              <motion.div
                initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0.2, scale: 0.6 }}
                animate={
                  reduce
                    ? { opacity: 1, scale: 1 }
                    : {
                        opacity: [0.2, 0.6, 1, 1, 1],
                        scale: [0.6, 0.72, 0.98, 1.07, 1],
                        filter: [
                          "drop-shadow(0 0 0px rgba(255,120,20,0))",
                          "drop-shadow(0 0 22px rgba(255,120,20,0.85))",
                          "drop-shadow(0 0 38px rgba(255,150,40,1))",
                          "drop-shadow(0 0 18px rgba(212,175,55,0.7))",
                          "drop-shadow(0 0 0px rgba(212,175,55,0))",
                        ],
                      }
                }
                transition={
                  reduce
                    ? { duration: 0.3 }
                    : { duration: 2.0, times: [0, 0.25, 0.5, 0.72, 1], ease: EASE_LUX }
                }
              >
                <Logo size={GEM} withWordmark={false} ring={false} />
              </motion.div>

              {/* the ring sets around the forged gem */}
              {!reduce && (
                <motion.svg
                  viewBox="0 0 100 100"
                  width={GEM * 1.6}
                  height={GEM * 1.6}
                  className="pointer-events-none absolute"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="pl-ring" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#E8CD8A" />
                      <stop offset="50%" stopColor="#B88A4A" />
                      <stop offset="100%" stopColor="#7A5C30" />
                    </linearGradient>
                  </defs>
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="46"
                    stroke="url(#pl-ring)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    style={{ transformOrigin: "50% 50%", rotate: -90 }}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 1.45, duration: 0.95, ease: EASE_LUX }}
                  />
                </motion.svg>
              )}
            </div>

            {/* tempering bar + status */}
            <div className="mt-14 flex flex-col items-center">
              <div className="h-px w-44 overflow-hidden bg-gold/15">
                <motion.div
                  className="h-full"
                  style={{ background: "linear-gradient(to right, #ff8a1f, #b88a4a)" }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: reduce ? 0.4 : 2.0, ease: EASE_LUX }}
                />
              </div>
              <div className="relative mt-5 h-3 w-48 text-center">
                <motion.span
                  className="absolute inset-0 text-[0.6rem] uppercase tracking-[0.42em] text-silver/45"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: reduce ? 0 : [0, 1, 1, 0] }}
                  transition={{ duration: 2, times: [0, 0.12, 0.82, 1] }}
                >
                  Forging
                </motion.span>
                <motion.span
                  className="absolute inset-0 text-[0.6rem] uppercase tracking-[0.42em] text-gold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reduce ? 0.1 : 1.95, duration: 0.5 }}
                >
                  Forged
                </motion.span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
