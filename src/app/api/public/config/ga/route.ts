import { resolveGaMeasurementId } from "@/lib/siteSettings";
import { jsonOk } from "@/lib/auth/api";

export async function GET() {
  const gaMeasurementId = await resolveGaMeasurementId();
  return jsonOk({ gaMeasurementId });
}
