import { Stagger, StaggerItem } from "./Stagger";
import { STRATEGY } from "../content/site";

/**
 * The systematic pipeline — Research → Model → Risk → Execute.
 * Horizontal stepper on desktop (connecting gold hairline + diamond nodes),
 * vertical rail on mobile. Decorative connectors are aria-hidden.
 */
const StrategyProcess = () => (
  <div className="relative overflow-visible px-1 sm:px-0">
    {/* Desktop: hairline spine through diamond centers (12.5% → 87.5%) */}
    <div
      className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[9px] hidden lg:block"
      aria-hidden
    >
      <div className="h-px w-full bg-gradient-to-r from-gold/35 via-gold/30 to-gold/35" />
    </div>

    <Stagger
      className="grid grid-cols-1 gap-12 overflow-visible sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
      gap={0.18}
    >
      {STRATEGY.process.map((step, i) => (
        <StaggerItem key={step.no} className="overflow-visible">
          <div className="group relative flex h-full gap-5 overflow-visible lg:flex-col lg:gap-0">
            {/* Mobile/tablet: vertical rail down the left of each step */}
            {i < STRATEGY.process.length - 1 && (
              <span
                className="absolute left-[9px] top-8 h-[calc(100%+3rem)] w-px bg-gradient-to-b from-gold/30 to-transparent sm:hidden"
                aria-hidden
              />
            )}

            {/* Node marker — diamond sitting on the spine (padded so rotate-45 isn’t clipped) */}
            <div className="relative z-10 flex shrink-0 items-center justify-center overflow-visible p-1 lg:w-full">
              <span className="block h-3.5 w-3.5 shrink-0 rotate-45 border border-gold bg-obsidian transition-all duration-500 group-hover:bg-gold group-hover:shadow-[0_0_20px_-2px_rgba(184,138,74,0.7)]" />
            </div>

            <div className="min-w-0 lg:mt-8 lg:text-center">
              <div className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-gold/75 sm:text-[0.75rem]">
                Step {step.no}
              </div>
              <h3 className="mt-3 font-serif text-2xl text-ghost sm:text-[1.75rem] lg:text-3xl">
                {step.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm font-light leading-relaxed text-silver/70 sm:text-[0.95rem] lg:mx-auto">
                {step.body}
              </p>
            </div>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  </div>
);

export default StrategyProcess;
