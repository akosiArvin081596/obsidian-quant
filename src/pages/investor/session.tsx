import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

/* ============================================================
   Investor session — MOCKUP ONLY.
   No backend, no real credentials. "Signing in" simply flips an
   in-memory flag (mirrored to sessionStorage so a hard refresh of a
   member-area page keeps you inside the shell) and records the
   Member ID typed at the gateway for the greeting line.
   ============================================================ */

type Session = {
  signedIn: boolean;
  /** The Member ID entered at the gateway — illustrative only. */
  memberId: string;
  signIn: (memberId: string) => void;
  signOut: () => void;
};

const STORAGE_KEY = "oqg.investor.session";

const read = (): { signedIn: boolean; memberId: string } => {
  if (typeof window === "undefined") return { signedIn: false, memberId: "" };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { signedIn: false, memberId: "" };
    const parsed = JSON.parse(raw) as { memberId?: string };
    return { signedIn: true, memberId: parsed.memberId ?? "" };
  } catch {
    return { signedIn: false, memberId: "" };
  }
};

const SessionContext = createContext<Session | null>(null);

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

export const useSession = (): Session => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
};
