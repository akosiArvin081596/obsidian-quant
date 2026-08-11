import { describe, expect, it } from "vitest";
import { buildOrganizationJsonLd, serializeJsonLd } from "./jsonld";

describe("serializeJsonLd", () => {
  it("escapes `<` so a value can never close the surrounding script tag", () => {
    const out = serializeJsonLd({ headline: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c");
  });

  it("still parses back to the original payload", () => {
    const payload = { headline: "</script>", nested: { a: ["<b>", 1] } };
    expect(JSON.parse(serializeJsonLd(payload))).toEqual(payload);
  });
});

describe("buildOrganizationJsonLd", () => {
  it("emits a schema.org Organization with the public brand identity", () => {
    const org = buildOrganizationJsonLd();
    expect(org["@context"]).toBe("https://schema.org");
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBeTruthy();
    expect(org.url).toMatch(/^https?:\/\//);
    expect(org.areaServed.length).toBeGreaterThan(0);
  });
});
