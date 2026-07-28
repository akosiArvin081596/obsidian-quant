import { prisma } from "@/lib/db";

export type Ga4Summary = {
  sessions: number;
  pageviews: number;
  users: number;
  periodDays: number;
};

/** Fetch GA4 summary via Data API when service account + property ID are configured. */
export async function fetchGa4Summary(days = 7): Promise<Ga4Summary | null> {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const saJson = process.env.GA_SERVICE_ACCOUNT_JSON?.trim();
  if (!propertyId || !saJson) return null;

  let credentials: { client_email: string; private_key: string };
  try {
    credentials = JSON.parse(saJson) as { client_email: string; private_key: string };
  } catch {
    return null;
  }

  const token = await getGoogleAccessToken(credentials);
  if (!token) return null;

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  const body = {
    dateRanges: [{ startDate: formatGaDate(start), endDate: formatGaDate(end) }],
    metrics: [{ name: "sessions" }, { name: "screenPageViews" }, { name: "totalUsers" }],
  };

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    rows?: { metricValues?: { value?: string }[] }[];
  };
  const values = data.rows?.[0]?.metricValues ?? [];
  return {
    sessions: Number(values[0]?.value ?? 0),
    pageviews: Number(values[1]?.value ?? 0),
    users: Number(values[2]?.value ?? 0),
    periodDays: days,
  };
}

function formatGaDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function getGoogleAccessToken(credentials: {
  client_email: string;
  private_key: string;
}): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const crypto = await import("node:crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(unsigned);
  const signature = sign
    .sign(credentials.private_key)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

function base64url(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Count published posts for a simple on-site metric when GA4 API is not wired. */
export async function fetchOnSiteMetrics() {
  const [publishedPosts, pendingComments, newsletterActive] = await Promise.all([
    prisma.post.count({ where: { status: "published", deletedAt: null } }),
    prisma.comment.count({ where: { status: "pending" } }),
    prisma.newsletterSubscriber.count({ where: { status: "active" } }),
  ]);
  return { publishedPosts, pendingComments, newsletterActive };
}
