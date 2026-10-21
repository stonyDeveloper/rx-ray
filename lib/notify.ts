import type { ExtractionResult, MatchResult } from "@/lib/match";

/**
 * Fires a webhook when a scan reads a registration number that is absent from
 * the register. Deliberately fire-and-forget with a short timeout: a slow or
 * down n8n instance must never slow down or break the user's scan result.
 *
 * The n8n side (webhook -> format -> email LASCOPA) is built separately; until
 * N8N_FLAGGED_WEBHOOK_URL is set this is a no-op.
 */
export async function notifyUnregistered(params: {
  extraction: ExtractionResult;
  match: MatchResult;
  imageBase64: string;
  mimeType: string;
}) {
  const webhookUrl = process.env.N8N_FLAGGED_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log(
      "[notify] N8N_FLAGGED_WEBHOOK_URL not set — skipping unregistered-report webhook."
    );
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        verdict: params.match.verdict,
        reason: params.match.reason,
        matchedProduct: params.match.matchedProduct,
        extracted: {
          product_name: params.extraction.product_name.value,
          nafdac_reg_no: params.extraction.nafdac_reg_no.value,
          batch_no: params.extraction.batch_no.value,
          expiry_date: params.extraction.expiry_date.value,
          manufacturer: params.extraction.manufacturer.value,
        },
        image: { base64: params.imageBase64, mimeType: params.mimeType },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[notify] n8n webhook returned ${res.status}`);
    }
  } catch (err) {
    // Never let a notification failure affect the scan response.
    console.error(
      "[notify] Failed to reach n8n webhook:",
      err instanceof Error ? err.message : err
    );
  } finally {
    clearTimeout(timeout);
  }
}
