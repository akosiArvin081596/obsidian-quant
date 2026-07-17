import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../lib/cn";
import { EASE_LUX } from "../lib/motion";
import type { PerfPoint } from "../views/investor/mockData";

type PerformanceChartProps = {
  /** Primary (member) series — indexed values, charted as the green alpha line. */
  series: PerfPoint[];
  /** Optional faint benchmark drawn behind the primary line. */
  benchmark?: PerfPoint[];
  className?: string;
};

const VIEW_W = 720;
const VIEW_H = 320;
const PAD = { top: 28, right: 24, bottom: 36, left: 40 };
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = VIEW_H - PAD.top - PAD.bottom;
const GRID_ROWS = 4;
const DRAW = 2.6; // seconds for the alpha line to draw in

type Pt = { x: number; y: number };

/** Map a series to plot coordinates against a shared value range. */
const project = (series: PerfPoint[], min: number, max: number): Pt[] => {
  const span = max - min || 1;
  const step = series.length > 1 ? PLOT_W / (series.length - 1) : 0;
  return series.map((p, i) => ({
    x: PAD.left + i * step,
    y: PAD.top + PLOT_H - ((p.value - min) / span) * PLOT_H,
  }));
};

const toLine = (pts: Pt[]): string =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

const toArea = (pts: Pt[]): string => {
  if (pts.length === 0) return "";
  const baseline = PAD.top + PLOT_H;
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${toLine(pts)} L${last.x.toFixed(1)},${baseline} L${first.x.toFixed(1)},${baseline} Z`;
};

/**
 * Lightweight, dependency-free SVG performance chart for the member area.
 * A green "alpha" line draws over a hairline grid above a soft area fill, with
 * an optional faint benchmark behind it and a pulsing live endpoint. On-brand
 * (graph-green / gold) and reduced-motion aware. Data-driven — pass a sample
 * PerfPoint[] series. Illustrative only; carries no performance claim.
 */
const PerformanceChart = ({ series, benchmark, className }: PerformanceChartProps) => {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotion();

  const all = benchmark ? [...series, ...benchmark] : series;
  const values = all.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // Pad the range a touch so the curve breathes within the frame.
  const pad = (rawMax - rawMin || 1) * 0.12;
  const min = rawMin - pad;
  const max = rawMax + pad;

  const pts = project(series, min, max);
  const linePath = toLine(pts);
  const areaPath = toArea(pts);
  const benchPts = benchmark ? project(benchmark, min, max) : [];
  const benchPath = benchmark ? toLine(benchPts) : "";
  const end = pts[pts.length - 1];

  // Horizontal grid lines + their value labels (top → bottom).
  const gridYs = Array.from({ length: GRID_ROWS + 1 }, (_, i) => PAD.top + (PLOT_H / GRID_ROWS) * i);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={cn("h-full w-full", className)}
      role="img"
      aria-label="Illustrative sample performance — indexed to 100 at inception"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3fb37f" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#3fb37f" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`stroke-${id}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#2f9e6a" />
          <stop offset="58%" stopColor="#3fb37f" />
          <stop offset="100%" stopColor="#7af0b4" />
        </linearGradient>
        <filter id={`glow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* hairline grid — silver rows, gold columns */}
      {gridYs.map((y) => (
        <line
          key={`row-${y.toFixed(0)}`}
          x1={PAD.left}
          x2={VIEW_W - PAD.right}
          y1={y}
          y2={y}
          stroke="#c9cdd3"
          strokeOpacity="0.07"
        />
      ))}
      {pts.map((p) => (
        <line
          key={`col-${p.x.toFixed(0)}`}
          x1={p.x}
          x2={p.x}
          y1={PAD.top}
          y2={PAD.top + PLOT_H}
          stroke="#b88a4a"
          strokeOpacity="0.045"
        />
      ))}

      {/* faint benchmark behind the alpha line */}
      {benchmark && (
        <motion.path
          d={benchPath}
          fill="none"
          stroke="#b88a4a"
          strokeOpacity="0.4"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 5"
          initial={{ pathLength: reduce ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.8, ease: EASE_LUX }}
        />
      )}

      {/* area fill */}
      <motion.path
        d={areaPath}
        fill={`url(#area-${id})`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, delay: reduce ? 0 : 1.4, ease: "easeOut" }}
      />

      {/* soft bloom under the alpha line */}
      <path
        d={linePath}
        fill="none"
        stroke="#3fb37f"
        strokeWidth="6"
        strokeOpacity="0.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${id})`}
      />

      {/* alpha line — gradient stroke, draws in */}
      <motion.path
        d={linePath}
        fill="none"
        stroke={`url(#stroke-${id})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: DRAW, ease: EASE_LUX }}
      />

      {/* vertices */}
      {pts.map((p, i) => (
        <motion.circle
          key={`v-${p.x.toFixed(0)}`}
          cx={p.x}
          cy={p.y}
          r="2.8"
          fill="#0b0d12"
          stroke="#3fb37f"
          strokeWidth="1.8"
          initial={{ scale: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.5,
            delay: reduce ? 0 : 0.7 + (i / Math.max(pts.length - 1, 1)) * DRAW,
            ease: EASE_LUX,
          }}
        />
      ))}

      {/* live endpoint — the current value, pulsing */}
      {end && (
        <circle cx={end.x} cy={end.y} r="4" fill="#9af3c6" filter={`url(#glow-${id})`}>
          {!reduce && (
            <>
              <animate
                attributeName="r"
                values="4;7.5;4"
                dur="3.0s"
                begin={`${DRAW}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;0.45;1"
                dur="3.0s"
                begin={`${DRAW}s`}
                repeatCount="indefinite"
              />
            </>
          )}
        </circle>
      )}

      {/* period labels — first / mid / last, kept sparse for legibility */}
      {[0, Math.floor((series.length - 1) / 2), series.length - 1]
        .filter((v, i, a) => a.indexOf(v) === i && series[v])
        .map((i) => (
          <text
            key={`lbl-${i}`}
            x={pts[i].x}
            y={VIEW_H - 12}
            textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"}
            fill="#c9cdd3"
            fillOpacity="0.4"
            className="font-mono"
            fontSize="11"
            letterSpacing="1.5"
          >
            {series[i].label.toUpperCase()}
          </text>
        ))}
    </svg>
  );
};

export default PerformanceChart;
