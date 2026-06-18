import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../lib/cn";
import { EASE_LUX } from "../lib/motion";

type DataChartProps = {
  className?: string;
  /** Show the faint benchmark + third series. */
  detailed?: boolean;
};

const ALPHA = "M40,250 L133,232 L226,238 L319,196 L412,188 L505,138 L598,120 L680,70";
const BENCH = "M40,272 L133,266 L226,256 L319,250 L412,228 L505,214 L598,196 L680,162";
const FAINT = "M40,262 L133,270 L226,256 L319,264 L412,246 L505,252 L598,232 L680,212";
const AREA =
  "M40,250 L133,232 L226,238 L319,196 L412,188 L505,138 L598,120 L680,70 L680,300 L40,300 Z";

const ALPHA_PTS: Array<[number, number]> = [
  [40, 250], [133, 232], [226, 238], [319, 196],
  [412, 188], [505, 138], [598, 120], [680, 70],
];

const GRID_Y = [70, 130, 190, 250];
const DRAW = 2.2; // seconds for the alpha line to draw before the comet runs

/**
 * Animated multi-series performance chart — the brand "data grid overlay".
 * The green alpha line draws over a faint grid, then a luminous comet traces
 * the curve on a loop while the live endpoint pulses.
 */
const DataChart = ({ className, detailed = true }: DataChartProps) => {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const alphaId = `alpha-${id}`;

  return (
    <svg
      viewBox="0 0 720 320"
      className={cn("h-full w-full", className)}
      role="img"
      aria-label="Illustrative systematic performance versus benchmark"
    >
      <defs>
        <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3fb37f" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#3fb37f" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`stroke-${id}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#2f9e6a" />
          <stop offset="58%" stopColor="#3fb37f" />
          <stop offset="100%" stopColor="#7af0b4" />
        </linearGradient>
        <filter id={`glow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* grid */}
      {GRID_Y.map((y) => (
        <line key={y} x1="40" x2="680" y1={y} y2={y} stroke="#c9cdd3" strokeOpacity="0.07" />
      ))}
      {[40, 200, 360, 520, 680].map((x) => (
        <line key={x} x1={x} x2={x} y1="40" y2="300" stroke="#b88a4a" strokeOpacity="0.05" />
      ))}

      {/* invisible reference path for the comet's motion */}
      <path id={alphaId} d={ALPHA} fill="none" stroke="none" />

      {detailed && (
        <motion.path
          d={FAINT}
          fill="none"
          stroke="#c9cdd3"
          strokeOpacity="0.22"
          strokeWidth="1.5"
          initial={{ pathLength: reduce ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: EASE_LUX }}
        />
      )}

      {detailed && (
        <motion.path
          d={BENCH}
          fill="none"
          stroke="#b88a4a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.2, ease: EASE_LUX }}
        />
      )}

      {/* area fill */}
      <motion.path
        d={AREA}
        fill={`url(#area-${id})`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: reduce ? 0 : 1, ease: "easeOut" }}
      />

      {/* soft bloom under the alpha line */}
      <path
        d={ALPHA}
        fill="none"
        stroke="#3fb37f"
        strokeWidth="6"
        strokeOpacity="0.16"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${id})`}
      />

      {/* alpha line — gradient stroke, draws in */}
      <motion.path
        d={ALPHA}
        fill="none"
        stroke={`url(#stroke-${id})`}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: DRAW, ease: EASE_LUX }}
      />

      {/* vertices */}
      {ALPHA_PTS.map(([x, y], i) => (
        <motion.circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r="3.2"
          fill="#0b0d12"
          stroke="#3fb37f"
          strokeWidth="2"
          initial={{ scale: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: reduce ? 0 : 0.5 + i * 0.18, ease: EASE_LUX }}
        />
      ))}

      {/* live endpoint — the current value, pulsing */}
      {!reduce && (
        <circle cx={680} cy={70} r="4" fill="#9af3c6" filter={`url(#glow-${id})`}>
          <animate attributeName="r" values="4;7.5;4" dur="2.4s" begin={`${DRAW}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.45;1" dur="2.4s" begin={`${DRAW}s`} repeatCount="indefinite" />
        </circle>
      )}

      {/* comet tracing the curve on a loop (head + trailing tail) */}
      {!reduce && (
        <>
          <circle r="4.6" fill="#aef7d0" filter={`url(#glow-${id})`}>
            <animateMotion dur="3.4s" begin={`${DRAW}s`} repeatCount="indefinite" calcMode="linear">
              <mpath href={`#${alphaId}`} />
            </animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.86;1" dur="3.4s" begin={`${DRAW}s`} repeatCount="indefinite" />
          </circle>
          <circle r="2.6" fill="#7af0b4">
            <animateMotion dur="3.4s" begin={`${DRAW + 0.14}s`} repeatCount="indefinite" calcMode="linear">
              <mpath href={`#${alphaId}`} />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.4;0.4;0" keyTimes="0;0.12;0.86;1" dur="3.4s" begin={`${DRAW + 0.14}s`} repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  );
};

export default DataChart;
