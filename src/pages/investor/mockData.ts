/* ============================================================
   Investor member area — SAMPLE fixtures (MOCKUP ONLY).
   Every figure below is ILLUSTRATIVE — there is no backend, no live
   feed, and nothing here represents an actual track record or claim.
   The numbers are realistic-but-obviously-round so the member
   experience can be demonstrated without implying performance.
   Consumed by both Dashboard.tsx and Portfolio.tsx.
   ============================================================ */

/** A single summary tile shown on the dashboard overview. */
export type SummaryTile = {
  label: string;
  value: string;
  /** Small qualifier beneath the value (e.g. period, posture note). */
  note: string;
  /** Optional signed delta string — drives up/down colouring. */
  delta?: string;
  tone?: "graph" | "loss" | "gold" | "neutral";
};

/** A point on the illustrative performance curve. */
export type PerfPoint = {
  /** Short period label, e.g. "Jan". */
  label: string;
  /** Indexed value — the series is normalised to 100 at inception. */
  value: number;
};

/** A held strategy line in the portfolio breakdown. */
export type Holding = {
  strategy: string;
  /** Mandate sleeve / asset arena. */
  sleeve: string;
  /** Target weight, percent of mandate. */
  weight: number;
  /** Illustrative sleeve value, USD. */
  value: number;
  /** Period contribution, percent (signed). */
  contribution: number;
  status: "Active" | "Scaling" | "Hedged";
};

/** One allocation slice for the breakdown bars / donut. */
export type AllocationSlice = {
  label: string;
  weight: number;
  /** Brand-token colour for the slice. */
  color: string;
};

/** A line item in the recent-activity / notices feed. */
export type ActivityItem = {
  date: string;
  kind: "Statement" | "Allocation" | "Risk" | "Notice";
  title: string;
  detail: string;
};

/* ---------------------------------------------------------------
   Headline summary — used for the dashboard tiles + portfolio header.
   --------------------------------------------------------------- */
export const PORTFOLIO_VALUE = 4_820_500;
export const PERIOD_RETURN_PCT = 6.4;
export const INCEPTION_RETURN_PCT = 18.2;

export const SUMMARY_TILES: SummaryTile[] = [
  {
    label: "Portfolio Value",
    value: "$4.82M",
    note: "Marked to sample close",
    delta: "+$181K",
    tone: "graph",
  },
  {
    label: "Period Return",
    value: "+6.4%",
    note: "Quarter to date",
    delta: "vs +2.1% bench",
    tone: "graph",
  },
  {
    label: "Risk Posture",
    value: "Balanced",
    note: "Vol target 9.5%",
    delta: "Drawdown −3.2%",
    tone: "gold",
  },
  {
    label: "Next Statement",
    value: "Jul 01",
    note: "Quarterly cycle",
    delta: "Q2 · 2026",
    tone: "neutral",
  },
];

/* ---------------------------------------------------------------
   Illustrative performance series — indexed to 100 at inception.
   A gently compounding, lightly-volatile curve (sample only).
   --------------------------------------------------------------- */
export const PERFORMANCE_SERIES: PerfPoint[] = [
  { label: "Inception", value: 100.0 },
  { label: "Aug", value: 101.4 },
  { label: "Sep", value: 100.8 },
  { label: "Oct", value: 103.6 },
  { label: "Nov", value: 105.1 },
  { label: "Dec", value: 104.3 },
  { label: "Jan", value: 107.9 },
  { label: "Feb", value: 109.6 },
  { label: "Mar", value: 111.2 },
  { label: "Apr", value: 114.0 },
  { label: "May", value: 116.5 },
  { label: "Jun", value: 118.2 },
];

/** Faint benchmark series shown behind the portfolio chart (sample). */
export const BENCHMARK_SERIES: PerfPoint[] = [
  { label: "Inception", value: 100.0 },
  { label: "Aug", value: 100.6 },
  { label: "Sep", value: 100.2 },
  { label: "Oct", value: 101.5 },
  { label: "Nov", value: 102.0 },
  { label: "Dec", value: 101.4 },
  { label: "Jan", value: 102.9 },
  { label: "Feb", value: 103.5 },
  { label: "Mar", value: 104.1 },
  { label: "Apr", value: 105.0 },
  { label: "May", value: 105.6 },
  { label: "Jun", value: 106.1 },
];

/* ---------------------------------------------------------------
   Holdings — sample strategy sleeves across the four arenas.
   Weights sum to 100.
   --------------------------------------------------------------- */
export const HOLDINGS: Holding[] = [
  {
    strategy: "Systematic Equities",
    sleeve: "Equity",
    weight: 38,
    value: 1_831_790,
    contribution: 3.1,
    status: "Active",
  },
  {
    strategy: "Rates & Macro",
    sleeve: "Macro",
    weight: 27,
    value: 1_301_535,
    contribution: 1.6,
    status: "Active",
  },
  {
    strategy: "Digital Assets",
    sleeve: "Digital",
    weight: 14,
    value: 674_870,
    contribution: 2.2,
    status: "Scaling",
  },
  {
    strategy: "Volatility & Tail",
    sleeve: "Volatility",
    weight: 12,
    value: 578_460,
    contribution: -0.4,
    status: "Hedged",
  },
  {
    strategy: "Cash & Collateral",
    sleeve: "Liquidity",
    weight: 9,
    value: 433_845,
    contribution: 0.1,
    status: "Active",
  },
];

/* ---------------------------------------------------------------
   Allocation breakdown — by arena, for the bars / donut.
   Colours pull from the brand tokens (graph-green / golds / silver).
   --------------------------------------------------------------- */
export const ALLOCATION: AllocationSlice[] = [
  { label: "Systematic Equities", weight: 38, color: "#3fb37f" },
  { label: "Rates & Macro", weight: 27, color: "#b88a4a" },
  { label: "Digital Assets", weight: 14, color: "#d4af37" },
  { label: "Volatility & Tail", weight: 12, color: "#7af0b4" },
  { label: "Cash & Collateral", weight: 9, color: "#4a525a" },
];

/* ---------------------------------------------------------------
   Recent activity — sample statements, allocation + risk notices.
   --------------------------------------------------------------- */
export const ACTIVITY: ActivityItem[] = [
  {
    date: "Jun 20",
    kind: "Allocation",
    title: "Digital Assets sleeve scaled to target",
    detail: "Phased entry completed; weight now 14% of mandate.",
  },
  {
    date: "Jun 14",
    kind: "Risk",
    title: "Volatility hedge re-struck",
    detail: "Tail overlay rolled forward at the quarterly reset.",
  },
  {
    date: "Jun 01",
    kind: "Statement",
    title: "May performance statement available",
    detail: "Period index +1.5%; full attribution enclosed.",
  },
  {
    date: "May 12",
    kind: "Notice",
    title: "Capacity review — mandate unchanged",
    detail: "No action required; allocation remains within band.",
  },
];

/** Account / investment-info facts shown on both pages (sample). */
export const ACCOUNT_INFO: Array<{ k: string; v: string; mono?: boolean }> = [
  { k: "Mandate", v: "Discretionary · Systematic", mono: false },
  { k: "Base Currency", v: "USD", mono: true },
  { k: "Inception", v: "Jul 2025", mono: false },
  { k: "Reporting", v: "Quarterly · monitored", mono: false },
  { k: "Liquidity", v: "Monthly · 30-day notice", mono: false },
  { k: "Custody", v: "Segregated · prime", mono: false },
];
