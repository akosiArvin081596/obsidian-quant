"use client";

import { MotionConfig } from "framer-motion";

/** Client boundary so framer-motion can wrap the App Router tree. */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
