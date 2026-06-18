import { useId } from "react";
import { motion } from "framer-motion";
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

/**
 * Animated multi-series performance chart — the brand "data grid overlay".
 * Green alpha line draws over a faint grid, with a benchmark for contrast.
 */
const DataChart = ({ className, detailed = true }: DataChartProps) => {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 720 320"
      className={cn("h-full w-full", className)}
      role="img"
      aria-label="Illustrative systematic performance versus benchmark"
    >
      <defs>
        <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3fb37f" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#3fb37f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* grid */}
      {GRID_Y.map((y) => (
        <line
          key={y}
          x1="40"
          x2="680"
          y1={y}
          y2={y}
          stroke="#c9cdd3"
          strokeOpacity="0.07"
        />
      ))}
      {[40, 200, 360, 520, 680].map((x) => (
        <line
          key={x}
          x1={x}
          x2={x}
          y1="40"
          y2="300"
          stroke="#b88a4a"
          strokeOpacity="0.05"
        />
      ))}

      {detailed && (
        <motion.path
          d={FAINT}
          fill="none"
          stroke="#c9cdd3"
          strokeOpacity="0.22"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
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
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.2, ease: EASE_LUX }}
        />
      )}

      {/* area + alpha line */}
      <motion.path
        d={AREA}
        fill={`url(#area-${id})`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 1, ease: "easeOut" }}
      />
      <motion.path
        d={ALPHA}
        fill="none"
        stroke="#3fb37f"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2.4, ease: EASE_LUX }}
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
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.6 + i * 0.18, ease: EASE_LUX }}
        />
      ))}
    </svg>
  );
};

export default DataChart;
