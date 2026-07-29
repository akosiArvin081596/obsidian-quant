import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  SITE_SETTING_KEYS,
  getSiteSetting,
  resolveGaMeasurementId,
  setSiteSetting,
} from "@/lib/siteSettings";
import { fetchGa4Summary, fetchOnSiteMetrics } from "@/lib/analytics/ga4";
import { isGroqConfigured } from "@/lib/ai/groq";

export async function GET() {
  try {
    await requireUser(PERMISSIONS.settingsManage);
    const [gaId, gscUrl, ga4, onSite] = await Promise.all([
      resolveGaMeasurementId(),
      getSiteSetting<string>(SITE_SETTING_KEYS.gscSiteUrl),
      fetchGa4Summary(7),
      fetchOnSiteMetrics(),
    ]);

    return jsonOk({
      gaMeasurementId: gaId,
      gscSiteUrl: gscUrl ?? "",
      ga4Connected: Boolean(process.env.GA4_PROPERTY_ID && process.env.GA_SERVICE_ACCOUNT_JSON),
      ga4,
      onSite,
      groqConfigured: isGroqConfigured(),
    });
  } catch (error) {
    return jsonError(error);
  }
}

const patchSchema = z.object({
  gaMeasurementId: z.string().min(1).optional(),
  gscSiteUrl: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireUser(PERMISSIONS.settingsManage);
    const body = patchSchema.parse(await req.json());

    if (body.gaMeasurementId !== undefined) {
      await setSiteSetting(
        SITE_SETTING_KEYS.gaMeasurementId,
        body.gaMeasurementId.trim(),
        actor.id,
      );
    }
    if (body.gscSiteUrl !== undefined) {
      await setSiteSetting(SITE_SETTING_KEYS.gscSiteUrl, body.gscSiteUrl.trim(), actor.id);
    }

    const [gaId, gscUrl] = await Promise.all([
      resolveGaMeasurementId(),
      getSiteSetting<string>(SITE_SETTING_KEYS.gscSiteUrl),
    ]);

    return jsonOk({ gaMeasurementId: gaId, gscSiteUrl: gscUrl ?? "" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid payload", "validation"));
    }
    return jsonError(error);
  }
}
