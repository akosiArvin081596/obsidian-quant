export const SESSION_STORAGE_KEY = "oqg.investor.session";

type DemoSession = {
  signedIn: boolean;
  memberId: string;
};

export const readDemoSession = (raw: string | null): DemoSession => {
  if (!raw) return { signedIn: false, memberId: "" };

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return { signedIn: false, memberId: "" };
    }

    const candidate = parsed as { demoVersion?: unknown; memberId?: unknown };
    if (candidate.demoVersion !== 1 || typeof candidate.memberId !== "string") {
      return { signedIn: false, memberId: "" };
    }

    const memberId = candidate.memberId.trim();
    return memberId
      ? { signedIn: true, memberId }
      : { signedIn: false, memberId: "" };
  } catch {
    return { signedIn: false, memberId: "" };
  }
};

export const writeDemoSession = (memberId: string): string => JSON.stringify({
  demoVersion: 1,
  memberId: memberId.trim(),
});
