import { useCallback, useMemo, useState } from "react";
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
  const [state, setState] = useState(read);

  const signIn = useCallback((memberId: string) => {
    const next = { signedIn: true, memberId };
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, writeDemoSession(memberId));
    } catch {
      /* sessionStorage unavailable — keep the in-memory flag anyway */
    }
    setState(next);
  }, []);

  const signOut = useCallback(() => {
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setState({ signedIn: false, memberId: "" });
  }, []);

  const value = useMemo<Session>(
    () => ({ ...state, signIn, signOut }),
    [state, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
