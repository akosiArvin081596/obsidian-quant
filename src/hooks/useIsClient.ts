"use client";

import { useSyncExternalStore } from "react";

/** The answer never changes after hydration, so there is nothing to subscribe to. */
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * False during SSR and the hydration pass, true immediately after. Lets a
 * component ship crawlable markup from the server and swap to client-only
 * behaviour without a hydration mismatch — and without the setState-in-effect
 * cascade that a `useState` + `useEffect` mounted-flag would cost.
 */
export const useIsClient = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
