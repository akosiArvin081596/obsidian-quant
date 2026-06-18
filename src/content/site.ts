/* ============================================================
   OBSIDIAN QUANT GROUP — Single source of truth for copy.
   All language is drawn from the brand guidelines + sample.
   ============================================================ */

export const BRAND = {
  name: "Obsidian Quant Group",
  short: "Obsidian Quant",
  primaryTagline: "Forged in Precision.",
  slogan: "Beyond the Market. Within the Model.",
  badge: "Institutional Quantitative Asset Management",
  intro:
    "A luxury quantitative investment architecture combining multi-layer systematic trading, institutional infrastructure, and absolute risk discipline.",
  email: "access@obsidianquant.group",
  presence: ["Zurich", "Singapore", "New York"],
  established: "MMXXVI",
} as const;

export const TAGLINES = {
  secondary: [
    "Where Data Becomes Conviction.",
    "The Architecture of Alpha.",
    "Intelligence, Systematized.",
  ],
  campaign: ["Beyond the Market. Within the Model.", "Precision Engineered Returns."],
} as const;

export const NAV = [
  { to: "/firm", label: "The Firm" },
  { to: "/strategy", label: "Strategy" },
  { to: "/architecture", label: "Architecture" },
  { to: "/insights", label: "Insights" },
] as const;

export const LEGAL = [
  "Regulatory Disclosure",
  "Data Cryptography",
  "DOX System Architecture",
] as const;

/* ---------- Essence (brand pillars) ---------- */
export const ESSENCE = {
  eyebrow: "Brand Essence",
  index: "01",
  title: "Strength, Intelligence, and Absolute Resilience.",
  body: "Inspired by the unyielding edge of natural obsidian stone and pristine alpine geography, our computational environment functions completely stripped of human bias.",
  cards: [
    {
      title: "Institutional Credibility",
      body: "Securitized operational architecture meeting strict compliance frameworks and rigorous transactional clearing directives.",
    },
    {
      title: "Data-Driven Execution",
      body: "Algorithmic frameworks parsing millions of data points across multi-asset nodes to identify structural alpha variations.",
    },
    {
      title: "Mathematical Precision",
      body: "Every allocation model is mathematically backtested through systemic iterations across extreme market paradigms.",
    },
    {
      title: "Exclusivity Mandate",
      body: "Operating on a strict limited-capacity footprint designed exclusively for institutional counterparties.",
    },
  ],
} as const;

/* ---------- Positioning (capabilities) ---------- */
export const POSITIONING = {
  eyebrow: "Business Positioning",
  index: "02",
  title: "Intelligence, Systematized.",
  body: "Where data becomes conviction. We eliminate directional market speculation in favor of systematic mathematical certainty.",
  pillars: [
    {
      no: "01",
      title: "Quantitative Research",
      tag: "Systematic Approach",
      body: "Deep mathematical exploration across structural liquidity markets, historical arbitrage horizons, and non-linear modeling matrices.",
    },
    {
      no: "02",
      title: "Portfolio Management",
      tag: "Precision Engineered",
      body: "Algorithmic diversification targeting systematic risk vectors. Our risk engine processes drawdown protocols dynamically.",
    },
    {
      no: "03",
      title: "Market Intelligence",
      tag: "Within The Model",
      body: "Real-time alternative-data pipelines converting unformatted quantitative variables directly into actionable capital placement.",
    },
  ],
} as const;

/* ---------- Architecture of Alpha ---------- */
export const ARCHITECTURE = {
  eyebrow: "The Architecture of Alpha",
  index: "03",
  title: "Engineered to Perform Outside the Bounds of Human Emotion.",
  body: "Modern markets operate at velocities that render traditional human analysis obsolete. Obsidian Quant Group engineers highly robust digital environments that identify alpha anomalies across disparate financial networks.",
  checklist: [
    "Automated infrastructure parsing complex multi-region order books seamlessly.",
    "Algorithmic risk mitigation that optimizes sizing variations automatically.",
    "Continuous backtesting across extreme historical market regimes.",
    "Cryptographically secured execution and clearing directives.",
  ],
  dox: {
    title: "DOX Operational System Access",
    rows: [
      { k: "System Code", v: "OBSIDIAN_CORE_V4", tone: "ghost" },
      { k: "Clear Space Requirement", v: "1X Capheight Bounds", tone: "ghost" },
      { k: "Primary Palette", v: "#0B0D12 · #111A28 · #B88A4A", tone: "gold" },
      { k: "Compliance Status", v: "Active / Treasury Mandated", tone: "graph" },
    ],
    portalLabel: "Secured Regulatory Portal",
    cta: "Initialize Terminal Gateway",
  },
} as const;

/* ---------- Headline metrics (illustrative) ---------- */
export const STATS = [
  { end: 2.41, decimals: 2, label: "Net Sharpe Ratio" },
  { end: 19.8, decimals: 1, suffix: "%", label: "Annualised, net" },
  { end: 11400, suffix: "+", label: "Markets Tracked" },
  { end: 24, suffix: " / 6", label: "Systematic Coverage" },
] as const;

/* ---------- The Firm ---------- */
export const FIRM = {
  hero: {
    eyebrow: "The Firm",
    title: "An investment house built like an instrument.",
    body: "Obsidian Quant Group is a private quantitative asset manager operating at the intersection of mathematics, infrastructure, and discipline — where every decision is the output of a model, never a mood.",
  },
  philosophy: {
    eyebrow: "Philosophy",
    title: "Two references shape everything we build.",
    blocks: [
      {
        title: "Obsidian stone",
        body: "Formed under pressure, edged to a precision sharper than steel. Our systems are forged the same way — tempered against extreme regimes until only the resilient survives.",
      },
      {
        title: "Alpine geography",
        body: "Clarity at altitude. We operate above the noise of sentiment, where the structure of the market becomes visible and the signal is clean.",
      },
    ],
  },
  principles: [
    { no: "I", title: "Bias is a liability", body: "The model decides. Discretion is removed from the path between research and execution." },
    { no: "II", title: "Risk is the product", body: "We engineer drawdown behaviour first; returns are what remains when risk is respected." },
    { no: "III", title: "Capacity is finite", body: "We cap mandates to protect edge. Scarcity is a feature of the architecture, not a marketing posture." },
    { no: "IV", title: "Infrastructure is alpha", body: "Latency, clearing, and data integrity are treated as sources of return in their own right." },
  ],
  governance: {
    eyebrow: "Governance",
    title: "Oversight without interference.",
    body: "An independent investment committee ratifies every model framework before capital is allocated. Compliance, risk, and research operate as separate authorities — a separation of powers encoded into the firm.",
    pillars: [
      { title: "Investment Committee", body: "Ratifies model frameworks and capacity limits." },
      { title: "Independent Risk", body: "Owns the drawdown mandate with veto authority." },
      { title: "Compliance & Clearing", body: "Maintains regulatory and transactional integrity." },
    ],
  },
} as const;

/* ---------- Strategy ---------- */
export const STRATEGY = {
  hero: {
    eyebrow: "Strategy & Capabilities",
    title: "Four disciplines. One systematic mandate.",
    body: "We do not forecast the market. We model its structure — then let the architecture allocate with mathematical certainty.",
  },
  process: [
    { no: "01", title: "Research", body: "Hypotheses are formed from structural market behaviour, not narrative." },
    { no: "02", title: "Model", body: "Signals are encoded, backtested, and stress-tested across regimes." },
    { no: "03", title: "Risk", body: "The risk engine sizes every position against live drawdown protocols." },
    { no: "04", title: "Execute", body: "Low-latency infrastructure clears across multi-region order books." },
  ],
  classes: [
    { title: "Systematic Equities", body: "Cross-sectional and statistical-arbitrage signals across global equity nodes." },
    { title: "Rates & Macro", body: "Structural carry, curve, and regime models across sovereign rates." },
    { title: "Digital Assets", body: "Liquidity-aware execution across regulated digital-asset venues." },
    { title: "Volatility & Tail", body: "Convex, mathematically-bounded hedges engineered for extreme paradigms." },
  ],
} as const;

/* ---------- Insights ---------- */
export const INSIGHTS = {
  hero: {
    eyebrow: "Insights",
    title: "Notes from within the model.",
    body: "Periodic research and commentary for our institutional counterparties. Distribution is restricted.",
  },
  articles: [
    { tag: "Research", date: "MAY 2026", title: "Regime detection without prediction", read: "8 min", body: "Why classifying the market's state beats forecasting its direction." },
    { tag: "Risk", date: "APR 2026", title: "Drawdown as a design constraint", read: "6 min", body: "Engineering the loss profile before engineering the return." },
    { tag: "Infrastructure", date: "MAR 2026", title: "Latency is a source of alpha", read: "7 min", body: "Treating execution plumbing as a first-class research surface." },
    { tag: "Market Intelligence", date: "FEB 2026", title: "Alternative data, structurally parsed", read: "9 min", body: "Converting unformatted signal into capital placement, cleanly." },
    { tag: "Method", date: "JAN 2026", title: "Backtesting across paradigms", read: "5 min", body: "Stress-testing models against the regimes that have not happened yet." },
    { tag: "Governance", date: "DEC 2025", title: "A separation of powers", read: "6 min", body: "How independent risk authority protects systematic edge." },
  ],
} as const;

/* ---------- Contact / Request Access ---------- */
export const CONTACT = {
  eyebrow: "Inquire Securely",
  title: "Request Strategic Allocation",
  body: "Access to Obsidian Quant asset pools is highly restricted. Complete our secure baseline verification framework to schedule an institutional briefing with our technical committee.",
  fields: {
    entity: "Institutional Entity",
    entityPlaceholder: "e.g. Sovereign Wealth Fund / Family Office",
    email: "Corporate Email Address",
    emailPlaceholder: "secure@entity.com",
  },
  submit: "Submit Credentials",
} as const;

/* ---------- DOX Portal ---------- */
export const PORTAL = {
  eyebrow: "Secured Regulatory Portal",
  title: "Terminal Gateway",
  body: "Authenticate to access the DOX operational system. Sessions are cryptographically bound and monitored.",
  systemCode: "OBSIDIAN_CORE_V4",
} as const;
