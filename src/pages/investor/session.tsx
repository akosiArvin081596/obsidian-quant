import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { SessionContext } from "./session-context";
import type { Session } from "./session-context";

/* ============================================================
   Investor session — MOCKUP ONLY.
   No backend, no real credentials. "Signing in" simply flips an
   in-memory flag (mirrored to sessionStorage so a hard refresh of a
   member-area page keeps you inside the shell) and records the
   Member ID typed at the gateway for the greeting line.
   ============================================================ */

const STORAGE_KEY = "oqg.investor.session";

const read = (): { signedIn: boolean; memberId: string } => {
  if (typeof window === "undefined") return { signedIn: false, memberId: "" };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { signedIn: false, memberId: "" };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return { signedIn: false, memberId: "" };
    }
    const memberId = (parsed as { memberId?: unknown }).memberId;
    return { signedIn: true, memberId: typeof memberId === "string" ? memberId : "" };
  } catch {
    return { signedIn: false, memberId: "" };
  }
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState(read);

  const signIn = useCallback((memberId: string) => {
    const next = { signedIn: true, memberId };
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ memberId }));
    } catch {
      /* sessionStorage unavailable — keep the in-memory flag anyway */
    }
    setState(next);
  }, []);

  const signOut = useCallback(() => {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
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
