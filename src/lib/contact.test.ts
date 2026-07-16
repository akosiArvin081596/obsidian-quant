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

  it("builds the CRM ProjectLead payload matching the webhook contract", () => {
    const payload = toCrmPayload(parseContactForm(filledForm()));
    expect(payload).toEqual({
      source: "obsidian-quant-web",
      companyName: "Acme & Partners",
      contactName: "Jordan Lee",
      contactEmail: "allocations@example.com",
      notes: expect.stringContaining("Counterparty profile: Family Office"),
      submittedAt: expect.any(String),
    });
    // The briefing note is folded into the single CRM notes field.
    expect(payload.notes).toContain("Please send terms.");
  });

  it("omits optional CRM fields when the form leaves them blank", () => {
    const form = new FormData();
    form.set("entity", "Northstar");
    form.set("profile", "Institutional Allocator");
    const payload = toCrmPayload(parseContactForm(form));
    expect(payload.companyName).toBe("Northstar");
    expect(payload.contactName).toBeUndefined();
    expect(payload.contactEmail).toBeUndefined();
  });

  it("formats Others for CRM display", () => {
    const form = filledForm();
    form.set("profile", "Others");
    form.set("profileOther", "Endowment");
    expect(profileLabel(parseContactForm(form))).toBe("Others — Endowment");
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

  it("posts the CRM lead to the same-origin /api/lead proxy by default", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.resetModules(); // no VITE_CRM_WEBHOOK_URL stub → default "/api/lead"

    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(() => Promise.resolve(new Response(null, { status: 201 })));
    vi.stubGlobal("fetch", fetchMock);

    const { submitContactRequest } = await import("./contact");
    await submitContactRequest(filledForm());

    const requested = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(requested).toContain("/api/lead");
    // The bearer secret is injected by nginx server-side, never by the browser.
    const crmCall = fetchMock.mock.calls.find((c) => String(c[0]) === "/api/lead");
    const headers = (crmCall?.[1] as RequestInit | undefined)?.headers as
      | Record<string, string>
      | undefined;
    expect(headers?.Authorization).toBeUndefined();
  });
});
