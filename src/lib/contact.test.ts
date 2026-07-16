import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildContactMailto,
  isOthersProfile,
  parseContactForm,
  profileLabel,
  toCrmPayload,
} from "./contact";

const filledForm = () => {
  const form = new FormData();
  form.set("entity", "Acme & Partners");
  form.set("name", "Jordan Lee");
  form.set("email", "allocations@example.com");
  form.set("profile", "Family Office");
  form.set("note", "Please send terms.\nSingapore mandate.");
  return form;
};

describe("parseContactForm", () => {
  it("captures name and profile fields", () => {
    expect(parseContactForm(filledForm())).toMatchObject({
      entity: "Acme & Partners",
      name: "Jordan Lee",
      email: "allocations@example.com",
      profile: "Family Office",
      source: "obsidian-quant-web",
    });
  });
});

describe("buildContactMailto", () => {
  it("encodes the inquiry with name", () => {
    const result = buildContactMailto("access@obsidianquantgroup.com", filledForm());
    const url = new URL(result);

    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe("access@obsidianquantgroup.com");
    expect(url.searchParams.get("subject")).toBe(
      "Institutional inquiry — Acme & Partners",
    );
    expect(url.searchParams.get("body")).toContain("Name: Jordan Lee");
    expect(url.searchParams.get("body")).toContain(
      "Reply email: allocations@example.com",
    );
    expect(url.searchParams.get("body")).toContain("Singapore mandate.");
  });

  it("uses an explicit placeholder when briefing notes are empty", () => {
    const form = new FormData();
    form.set("entity", "Northstar");
    form.set("name", "Ava Chen");
    form.set("email", "team@example.com");
    form.set("profile", "Institutional Allocator");

    const result = buildContactMailto("access@obsidianquantgroup.com", form);

    expect(new URL(result).searchParams.get("body")).toContain(
      "Briefing notes:\nNot provided",
    );
  });

  it("includes Others explanation in the profile line", () => {
    const form = filledForm();
    form.set("profile", "Others");
    form.set("profileOther", "Pension consultant");

    const body = new URL(
      buildContactMailto("access@obsidianquantgroup.com", form),
    ).searchParams.get("body");

    expect(body).toContain("Counterparty profile: Others — Pension consultant");
  });
});

describe("profile helpers", () => {
  it("detects Others profile", () => {
    expect(isOthersProfile("Others")).toBe(true);
    expect(isOthersProfile("Family Office")).toBe(false);
  });

  it("formats Others for CRM display", () => {
    const form = filledForm();
    form.set("profile", "Others");
    form.set("profileOther", "Endowment");
    expect(profileLabel(parseContactForm(form))).toBe("Others — Endowment");
  });
});

// Proposed CRM ProjectLead contract (docs/crm-lead-intake-brief.md field table).
// TODO(crm-contract): these field names are pending the CRM engineer's hand-back.
describe("toCrmPayload", () => {
  it("maps entity/name/email to the ProjectLead field names", () => {
    const payload = toCrmPayload(parseContactForm(filledForm()));
    expect(payload).toMatchObject({
      companyName: "Acme & Partners", // entity -> companyName (required)
      contactName: "Jordan Lee", // name -> contactName
      contactEmail: "allocations@example.com", // email -> contactEmail
    });
  });

  it("passes source and submittedAt through untouched", () => {
    const submission = parseContactForm(filledForm());
    const payload = toCrmPayload(submission);
    expect(payload.source).toBe("obsidian-quant-web");
    expect(payload.submittedAt).toBe(submission.submittedAt);
  });

  it("combines the counterparty profile and briefing note into notes", () => {
    const payload = toCrmPayload(parseContactForm(filledForm()));
    expect(payload.notes).toContain("Counterparty profile: Family Office");
    expect(payload.notes).toContain("Please send terms.");
    expect(payload.notes).toContain("Singapore mandate.");
  });

  it("folds the Others explanation into notes", () => {
    const form = filledForm();
    form.set("profile", "Others");
    form.set("profileOther", "Pension consultant");
    const payload = toCrmPayload(parseContactForm(form));
    expect(payload.notes).toContain("Counterparty profile: Others — Pension consultant");
  });

  it("keeps notes to just the profile line when no briefing note is given", () => {
    const form = new FormData();
    form.set("entity", "Northstar");
    form.set("name", "Ava Chen");
    form.set("email", "team@example.com");
    form.set("profile", "Institutional Allocator");

    const payload = toCrmPayload(parseContactForm(form));
    expect(payload.notes).toBe("Counterparty profile: Institutional Allocator");
  });

  it("does not emit the retired flat-lead fields", () => {
    const payload = toCrmPayload(parseContactForm(filledForm()));
    expect(payload).not.toHaveProperty("institutional_entity");
    expect(payload).not.toHaveProperty("status");
    expect(payload).not.toHaveProperty("notify_inbox");
  });
});

describe("submitContactRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  // CRM is documented as an OPTIONAL secondary channel: a webhook failure must
  // never re-open the mailto draft when the email inbox already accepted the lead.
  it("resolves ok (no mailto fallback) when the CRM webhook rejects but email succeeds", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("VITE_CRM_WEBHOOK_URL", "https://crm.example.com/hook");
    // Re-import so the module re-reads the stubbed env into CRM_WEBHOOK_URL.
    vi.resetModules();

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("crm.example.com")) {
        return Promise.reject(new Error("CRM webhook down"));
      }
      return Promise.resolve(new Response(null, { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const { submitContactRequest } = await import("./contact");
    const result = await submitContactRequest(filledForm());

    // Email is the sole gate → clean ok with no draft, despite the CRM failure.
    expect(result).toEqual({ ok: true });

    const requested = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(requested.some((url) => url.includes("formsubmit.co"))).toBe(true);
    expect(requested.some((url) => url.includes("crm.example.com"))).toBe(true);
  });

  // Default path with no override: the lead posts to same-origin /api/lead. While
  // this is a draft the nginx proxy may not be deployed yet, so that fetch can
  // reject — it must stay best-effort and never gate the email-confirmed lead.
  it("resolves ok when the default /api/lead push rejects but email succeeds", async () => {
    // No VITE_CRM_WEBHOOK_URL stub → CRM_WEBHOOK_URL defaults to "/api/lead".
    vi.resetModules();

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/lead")) {
        return Promise.reject(new Error("proxy not deployed (404)"));
      }
      return Promise.resolve(new Response(null, { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const { submitContactRequest } = await import("./contact");
    const result = await submitContactRequest(filledForm());

    // Email is the sole gate → clean ok, no draft, despite the proxy rejection.
    expect(result).toEqual({ ok: true });

    const requested = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(requested.some((url) => url.includes("/api/lead"))).toBe(true);
    expect(requested.some((url) => url.includes("formsubmit.co"))).toBe(true);
  });
});
