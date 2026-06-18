import CountUp from "react-countup";
import { cn } from "../lib/cn";

type StatCounterProps = {
  end: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
};

/** Animated metric — counts up when scrolled into view. */
const StatCounter = ({
  end,
  label,
  prefix,
  suffix,
  decimals = 0,
  className,
}: StatCounterProps) => (
  <div className={cn("text-center md:text-left", className)}>
    <div className="font-serif text-5xl font-semibold text-gold-gradient lg:text-6xl">
      <CountUp
        end={end}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        duration={2.6}
        separator=","
        enableScrollSpy
        scrollSpyOnce
      />
    </div>
    <div className="mt-3 text-[0.66rem] uppercase tracking-[0.24em] text-silver/55">
      {label}
    </div>
  </div>
);

export default StatCounter;
