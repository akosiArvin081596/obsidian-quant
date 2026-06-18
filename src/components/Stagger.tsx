import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Accepted for compatibility — reveals are now scroll-driven, in DOM order. */
  gap?: number;
  delay?: number;
};

/**
 * Layout container for a group of scroll-driven items. It keeps its grid/flex
 * classes; each <StaggerItem> reveals individually, tied to scroll, as it
 * rises into view — naturally cascading top-to-bottom by position.
 */
export const Stagger = ({ children, className }: StaggerProps) => (
  <div className={cn("sd-stagger", className)}>{children}</div>
);

export const StaggerItem = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <div className={cn("sd-reveal", className)}>{children}</div>;
