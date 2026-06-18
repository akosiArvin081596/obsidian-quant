import { Stagger, StaggerItem } from "./Stagger";
import { STRATEGY } from "../content/site";

/**
 * The systematic pipeline — Research → Model → Risk → Execute.
 * Horizontal stepper on desktop (connecting gold hairline + diamond nodes),
 * vertical rail on mobile. Decorative connectors are aria-hidden.
 */
const StrategyProcess = () => (
  <div className="relative">
    {/* Desktop: horizontal hairline spine behind the nodes */}
    <div
      className="pointer-events-none absolute left-0 right-0 top-[7px] hidden lg:block"
      aria-hidden
    >
      <div className="mx-auto h-px w-[calc(100%-12.5%)] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </div>

    <Stagger
      className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
      gap={0.18}
    >
      {STRATEGY.process.map((step, i) => (
        <StaggerItem key={step.no}>
          <div className="group relative flex h-full gap-5 lg:flex-col lg:gap-0">
            {/* Mobile/tablet: vertical rail down the left of each step */}
            {i < STRATEGY.process.length - 1 && (
              <span
                className="absolute left-[7px] top-7 h-[calc(100%+3rem)] w-px bg-gradient-to-b from-gold/30 to-transparent sm:hidden"
                aria-hidden
              />
            )}

            {/* Node marker — diamond sitting on the spine */}
            <div className="relative z-10 flex-shrink-0">
              <span className="block h-3.5 w-3.5 rotate-45 border border-gold bg-obsidian transition-all duration-500 group-hover:bg-gold group-hover:shadow-[0_0_20px_-2px_rgba(184,138,74,0.7)]" />
            </div>

            <div className="lg:mt-8">
              <div className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-gold/70">
                Step {step.no}
              </div>
              <h3 className="mt-3 font-serif text-2xl text-ghost">
                {step.title}
              </h3>
              <p className="mt-3 max-w-xs text-xs font-light leading-relaxed text-silver/60">
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
