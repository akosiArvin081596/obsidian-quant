import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Inner container classes (max width). Pass "" to disable the container. */
  inner?: string;
  /** Vertical padding. */
  spacing?: string;
};

/** Consistent section rhythm + centered container. */
const Section = ({
  id,
  children,
  className,
  inner = "max-w-7xl",
  spacing = "py-24 lg:py-32",
}: SectionProps) => (
  <section
    id={id}
    className={cn("relative px-6 lg:px-16", spacing, className)}
  >
    {inner ? <div className={cn("scene-content relative z-10 mx-auto w-full", inner)}>{children}</div> : children}
  </section>
);

export default Section;
