import { prisma } from "@/lib/db";

export const SITE_SETTING_KEYS = {
  gaMeasurementId: "ga_measurement_id",
  gscSiteUrl: "gsc_site_url",
} as const;

const DEFAULT_GA_ID = "G-VSGHTHYWHD";

export async function getSiteSetting<T>(key: string): Promise<T | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (!row) return null;
  return row.valueJson as T;
}

export async function setSiteSetting(
  key: string,
  value: unknown,
  updatedById?: string,
): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    create: {
      key,
      valueJson: value as object,
      updatedById: updatedById ?? null,
    },
    update: {
      valueJson: value as object,
      updatedById: updatedById ?? null,
    },
  });
}

/** GA measurement ID: env override → DB setting → hardcoded default. */
export async function resolveGaMeasurementId(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (fromEnv) return fromEnv;
  const fromDb = await getSiteSetting<string>(SITE_SETTING_KEYS.gaMeasurementId);
  if (fromDb) return fromDb;
  return DEFAULT_GA_ID;
}

export function resolveGaMeasurementIdSync(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_GA_ID;
}
