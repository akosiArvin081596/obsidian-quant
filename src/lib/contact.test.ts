import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildContactMailto,
  isOthersProfile,
  parseContactForm,
  profileLabel,
  toCrmPayload,
  toEmailPayload,
} from "./contact";

const filledForm = () => {
  const form = new FormData();
  form.set("firstName", "Jordan");
  form.set("lastName", "Lee");
  form.set("email", "allocations@example.com");
  form.set("entity", "Meridian Family Office");
  form.set("profile", "Family Office");
  form.set("note", "Please send terms.\nSingapore mandate.");
  return form;
};

describe("parseContactForm", () => {
  it("captures the name, entity and profile fields", () => {
    expect(parseContactForm(filledForm())).toMatchObject({
      firstName: "Jordan",
      lastName: "Lee",
      name: "Jordan Lee",
      email: "allocations@example.com",
      entity: "Meridian Family Office",
      profile: "Family Office",
      source: "obsidian-quant-web",
    });
  });

  it("composes the display name from the two captured parts", () => {
    const form = filledForm();
    form.set("firstName", "  Ava  ");
    form.set("lastName", "  Chen ");
    expect(parseContactForm(form).name).toBe("Ava Chen");
  });

  // Regression guard for the heuristic this form exists to avoid. A surname is
  // captured whole and never re-split, so multi-token family names survive; if
  // anyone reintroduces a "derive from full name" path, this is what breaks.
  it("keeps a particle surname intact", () => {
    const form = filledForm();
    form.set("firstName", "Sanne");
    form.set("lastName", "van der Berg");

    const submission = parseContactForm(form);
    expect(submission.lastName).toBe("van der Berg");
    expect(submission.name).toBe("Sanne van der Berg");

    const payload = toCrmPayload(submission);
    expect(payload.contactName).toBe("Sanne van der Berg");
    expect(payload.contactFirstName).toBe("Sanne");
  });
});

describe("buildContactMailto", () => {
  it("encodes the inquiry with name", () => {
    const result = buildContactMailto("access@obsidianquantgroup.com", filledForm());
    const url = new URL(result);

    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe("access@obsidianquantgroup.com");
    expect(url.searchParams.get("subject")).toBe(
      "Institutional inquiry — Family Office",
    );
    expect(url.searchParams.get("body")).toContain("Name: Jordan Lee");
    expect(url.searchParams.get("body")).toContain(
      "Reply email: allocations@example.com",
    );
    // The draft is the fallback carrier of the whole lead, so it must name the
    // entity too — otherwise a failed intake loses the field the internal
    // notification template is built around.
    expect(url.searchParams.get("body")).toContain(
      "Institutional entity: Meridian Family Office",
    );
    expect(url.searchParams.get("body")).toContain("Singapore mandate.");
  });

  it("uses an explicit placeholder when briefing notes are empty", () => {
    const form = new FormData();
    form.set("firstName", "Ava");
    form.set("lastName", "Chen");
    form.set("email", "team@example.com");
    form.set("entity", "Chen Capital Partners");
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
      companyName: "Meridian Family Office",
      entityName: "Meridian Family Office",
      contactName: "Jordan Lee",
      contactFirstName: "Jordan",
      contactEmail: "allocations@example.com",
      notes: expect.stringContaining("Counterparty profile: Family Office"),
      submittedAt: expect.any(String),
    });
    // The briefing note is folded into the single CRM notes field.
    expect(payload.notes).toContain("Please send terms.");
  });

  // The bug this whole field restoration fixes: the CRM's company column used to
  // receive the dropdown CATEGORY, so the internal notification read
  // "Institutional Entity: Family Office" for every family office on earth.
  it("never puts the counterparty category in companyName when an entity is given", () => {
    const form = filledForm();
    form.set("entity", "Meridian Family Office");
    form.set("profile", "Family Office");

    const payload = toCrmPayload(parseContactForm(form));
    expect(payload.companyName).toBe("Meridian Family Office");
    expect(payload.entityName).toBe("Meridian Family Office");
    expect(payload.companyName).not.toBe("Family Office");
    // The category is still recorded — just as free text, where it belongs.
    expect(payload.notes).toContain("Counterparty profile: Family Office");
  });

  it("falls back to the profile label so the CRM-required companyName is never blank", () => {
    const form = new FormData();
    form.set("profile", "Institutional Allocator");
    const payload = toCrmPayload(parseContactForm(form));
    // Unreachable through the form (entity is required + min-length); this only
    // guarantees the required field can never go out empty and 400 the webhook.
    expect(payload.companyName).toBe("Institutional Allocator");
    expect(payload.entityName).toBe("Institutional Allocator");
  });

  it("omits optional CRM fields when the form leaves them blank", () => {
    const form = new FormData();
    form.set("profile", "Institutional Allocator");
    const payload = toCrmPayload(parseContactForm(form));
    expect(payload.contactName).toBeUndefined();
    expect(payload.contactFirstName).toBeUndefined();
    expect(payload.contactEmail).toBeUndefined();
  });

  // The CRM call is fire-and-forget, so a 400 would be invisible to the visitor
  // AND to us. Clamp to its zod bounds instead of gambling on input length.
  it("clamps every bounded field to the CRM's limits", () => {
    const form = filledForm();
    form.set("firstName", "F".repeat(400));
    form.set("lastName", "L".repeat(400));
    form.set("entity", "E".repeat(400));
    form.set("note", "N".repeat(9000));

    const payload = toCrmPayload(parseContactForm(form));
    expect(payload.companyName).toHaveLength(200);
    expect(payload.entityName).toHaveLength(200);
    expect(payload.contactName).toHaveLength(120);
    expect(payload.contactFirstName).toHaveLength(120);
    expect(payload.notes).toHaveLength(5000);
  });

  it("formats Others for CRM display", () => {
    const form = filledForm();
    form.set("profile", "Others");
    form.set("profileOther", "Endowment");
    expect(profileLabel(parseContactForm(form))).toBe("Others — Endowment");
  });
});

describe("toEmailPayload", () => {
  // The spam defence, across both hops it travels: captured WITHOUT trimming,
  // then handed to FormSubmit as `_honey`. FormSubmit silently drops any
  // submission whose `_honey` is non-empty — so trimming a whitespace-only bot
  // fill back to "" would deliver the exact spam the field exists to stop.
  it("keeps the honeypot raw and passes it through to FormSubmit", () => {
    const form = filledForm();
    form.set("_honey", "   ");

    const submission = parseContactForm(form);
    expect(submission.honeypot).toBe("   ");
    expect(toEmailPayload(submission)._honey).toBe("   ");
  });

  it("subjects the notification with the counterparty profile", () => {
    const payload = toEmailPayload(parseContactForm(filledForm()));
    expect(payload._subject).toBe("Institutional inquiry — Family Office");
    // The separator is U+2014 EM DASH — a different character from the U+2013
    // en dash the §4.1 copy is contractually held to. Asserted by codepoint so
    // this line stays pure ASCII: a repo-wide "smart dash" pass cannot rewrite
    // the source and the expectation above in lockstep and still stay green.
    expect([...payload._subject].map((c) => c.codePointAt(0))).toContain(0x2014);
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
    vi.stubEnv("NEXT_PUBLIC_CRM_WEBHOOK_URL", "https://crm.example.com/hook");
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
    vi.resetModules(); // no NEXT_PUBLIC_CRM_WEBHOOK_URL stub → default "/api/lead"

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

  it("sends the entity as companyName/entityName on the wire", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.resetModules();

    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(() => Promise.resolve(new Response(null, { status: 201 })));
    vi.stubGlobal("fetch", fetchMock);

    const { submitContactRequest } = await import("./contact");
    await submitContactRequest(filledForm());

    const crmCall = fetchMock.mock.calls.find((c) => String(c[0]) === "/api/lead");
    const body = JSON.parse(String((crmCall?.[1] as RequestInit).body));
    expect(body).toMatchObject({
      source: "obsidian-quant-web",
      companyName: "Meridian Family Office",
      entityName: "Meridian Family Office",
      contactName: "Jordan Lee",
      contactFirstName: "Jordan",
      contactEmail: "allocations@example.com",
    });
    expect(body.notes).toContain("Counterparty profile: Family Office");
    expect(body.submittedAt).toMatch(/Z$/);
  });

  // The mailto arm is the only thing keeping a lead alive when the inbox is
  // unreachable, and it is what the panel's "Action Required" state and its
  // screen-reader announcement are driven from — so it needs its own guard.
  it("falls back to a mailto draft carrying the lead when the inbox rejects", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.resetModules();

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("formsubmit.co")) {
        return Promise.resolve(new Response("unavailable", { status: 503 }));
      }
      return Promise.resolve(new Response(null, { status: 201 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const { submitContactRequest } = await import("./contact");
    const result = await submitContactRequest(filledForm());

    if (!result.ok || result.mailtoFallback !== true) {
      throw new Error(`expected a mailto fallback, got ${JSON.stringify(result)}`);
    }

    const url = new URL(result.mailto);
    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe("access@obsidianquantgroup.com");
    // The draft has to carry the whole lead — it is the last copy of it.
    const body = url.searchParams.get("body") ?? "";
    expect(body).toContain("Name: Jordan Lee");
    expect(body).toContain("Reply email: allocations@example.com");
    expect(body).toContain("Institutional entity: Meridian Family Office");
    // Exactly one delivery attempt: a retry here would double-send the lead
    // whenever the first attempt actually landed but answered non-2xx.
    const emailCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes("formsubmit.co"),
    );
    expect(emailCalls).toHaveLength(1);
  });

  // Validation runs before EITHER channel fires. A rejected submission that had
  // already posted the lead would leave the CRM holding a record the visitor was
  // just told did not go through.
  it("issues zero fetches when the institutional entity is too short", async () => {
    vi.resetModules();
    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(() => Promise.resolve(new Response(null, { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);

    const { submitContactRequest } = await import("./contact");
    const form = filledForm();
    form.set("entity", "M");

    const result = await submitContactRequest(form);

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // "Others" is the one profile the dropdown cannot describe on its own, so an
  // unexplained "Others" reaches the desk as a lead with no counterparty
  // category at all. Rejected by the same pre-flight as the other guards —
  // before either channel fires.
  it("rejects an unexplained Others profile without issuing a fetch", async () => {
    vi.resetModules();
    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(() => Promise.resolve(new Response(null, { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);

    const { submitContactRequest } = await import("./contact");
    const form = filledForm();
    form.set("profile", "Others");
    form.set("profileOther", "");

    expect(await submitContactRequest(form)).toEqual({
      ok: false,
      error: "Please explain your counterparty profile.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("issues zero fetches when a required field is missing", async () => {
    vi.resetModules();
    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(() => Promise.resolve(new Response(null, { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);

    const { submitContactRequest } = await import("./contact");

    for (const missing of ["firstName", "lastName", "email", "entity"]) {
      const form = filledForm();
      form.set(missing, "");
      const result = await submitContactRequest(form);
      expect(result, `missing ${missing} must be rejected`).toEqual({
        ok: false,
        error: "Please complete all required fields.",
      });
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
