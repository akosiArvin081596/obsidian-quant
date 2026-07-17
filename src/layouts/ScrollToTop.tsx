"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Resets scroll position to the top whenever the route changes. */
const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
