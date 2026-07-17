import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { SessionContext } from "./session-context";
import type { Session } from "./session-context";
import { readDemoSession, SESSION_STORAGE_KEY, writeDemoSession } from "./session-storage";

/* ============================================================
   Investor session — MOCKUP ONLY.
   No backend, no real credentials. "Signing in" simply flips an
   in-memory flag (mirrored to sessionStorage so a hard refresh of a
   member-area page keeps you inside the shell) and records the
   Member ID typed at the gateway for the greeting line.
   ============================================================ */

const read = (): { signedIn: boolean; memberId: string } => {
  if (typeof window === "undefined") return { signedIn: false, memberId: "" };
  try {
    return readDemoSession(window.sessionStorage.getItem(SESSION_STORAGE_KEY));
  } catch {
    return { signedIn: false, memberId: "" };
  }
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  // Deterministic signed-out initial state: the static export prerenders
  // signed-out, so reading sessionStorage during render would make a returning
  // member's first client render diverge from the server HTML (hydration
  // error + flash). Sync from storage after mount instead; `hydrated` tells
  // layout guards when the real session is known.
  const [state, setState] = useState({ signedIn: false, memberId: "", hydrated: false });

  useEffect(() => {
    // One-shot post-mount sync from the external store (sessionStorage) —
    // intentionally a render-triggering set; see the hydration note above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ ...read(), hydrated: true });
  }, []);

  const signIn = useCallback((memberId: string) => {
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, writeDemoSession(memberId));
    } catch {
      /* sessionStorage unavailable — keep the in-memory flag anyway */
    }
    setState({ signedIn: true, memberId, hydrated: true });
  }, []);

  const signOut = useCallback(() => {
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setState({ signedIn: false, memberId: "", hydrated: true });
  }, []);

  const value = useMemo<Session>(
    () => ({ ...state, signIn, signOut }),
    [state, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
