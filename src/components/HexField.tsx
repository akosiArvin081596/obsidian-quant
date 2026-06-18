import { cn } from "../lib/cn";

/** Decorative honeycomb cluster — the brand "hexagonal pattern" accent. */
const HEX = "0,-13 11.3,-6.5 11.3,6.5 0,13 -11.3,6.5 -11.3,-6.5";

const CELLS: Array<[number, number]> = [
  [30, 30], [53, 17], [76, 30], [99, 17], [122, 30],
  [30, 56], [53, 43], [76, 56], [99, 43], [122, 56],
  [53, 69], [76, 82], [99, 69],
];

const HexField = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 152 100"
    className={cn("h-auto w-full", className)}
    fill="none"
    aria-hidden
  >
    {CELLS.map(([x, y], i) => (
      <polygon
        key={`${x}-${y}`}
        points={HEX}
        transform={`translate(${x} ${y})`}
        stroke="#b88a4a"
        strokeWidth="0.8"
        strokeOpacity={0.18 + (i % 3) * 0.1}
      />
    ))}
  </svg>
);

export default HexField;
