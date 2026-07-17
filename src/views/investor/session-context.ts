import { createContext, useContext } from "react";

/* ============================================================
   Investor session — context + consumer hook. MOCKUP ONLY.
   Split out from session.tsx so the provider file exports only a
   component (keeps React Fast Refresh happy:
   react-refresh/only-export-components).
   ============================================================ */

export type Session = {
  signedIn: boolean;
  /** The Member ID entered at the gateway — illustrative only. */
  memberId: string;
  /**
   * False until the client has read sessionStorage after mount. Layout guards
   * must not redirect while false — the prerendered HTML is always signed-out,
   * and the real session only becomes known post-hydration.
   */
  hydrated: boolean;
  signIn: (memberId: string) => void;
  signOut: () => void;
};

export const SessionContext = createContext<Session | null>(null);

export const useSession = (): Session => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
};
