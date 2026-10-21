import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { matchExtraction, type ExtractionResult } from "@/lib/match";
import { notifyUnregistered } from "@/lib/notify";

export const runtime = "nodejs";

const EXTRACTION_PROMPT = `You are reading a photograph of a medicine pack sold in Nigeria, for a safety-verification tool. Extract exactly these fields:

- product_name: the brand/product name printed on the pack
- nafdac_reg_no: the NAFDAC registration number (format like "A4-1234" or "04-1793" — look for text near "NAFDAC Reg. No" or similar)
- batch_no: the batch/lot number (look for "Batch No", "Lot No", or similar)
- expiry_date: the expiry date as printed (look for "EXP", "Exp. Date", or similar)
- manufacturer: the manufacturer name, if printed

Rules:
1. Only report what is actually legible in the photo. Do not guess, infer, or auto-correct a value you cannot clearly read.
2. For each field, also give a "confidence" of exactly one of: "clear" (confidently read), "uncertain" (partially visible or you're not fully sure), "not_visible" (not in frame, illegible, or absent).
3. If a field's confidence is "not_visible", its value must be null.
4. A registration number is the only field that can confirm a product. Do not expand abbreviations, do not add dashes that are not printed, and do not substitute a similar-looking digit.
5. Respond with ONLY a single JSON object, no markdown code fences, no commentary before or after. Match this exact shape:

{
  "product_name": { "value": string | null, "confidence": "clear" | "uncertain" | "not_visible" },
  "nafdac_reg_no": { "value": string | null, "confidence": "clear" | "uncertain" | "not_visible" },
  "batch_no": { "value": string | null, "confidence": "clear" | "uncertain" | "not_visible" },
  "expiry_date": { "value": string | null, "confidence": "clear" | "uncertain" | "not_visible" },
  "manufacturer": { "value": string | null, "confidence": "clear" | "uncertain" | "not_visible" }
}`;

function parseModelJson(text: string): ExtractionResult {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set on the server." },
      { status: 500 }
    );
  }

  const form = await req.formData();
  const file = form.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No image file provided under field 'image'." },
      { status: 400 }
    );
  }

  if (file.size > 12 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Photo is larger than 12 MB. Try a smaller photo." },
      { status: 413 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = file.type || "image/jpeg";

  const client = new GoogleGenAI({ apiKey });
  const startedAt = Date.now();

  try {
    const interaction = await client.interactions.create({
      // gemini-3.8-flash gave accurate results but took 90-200s per request
      // in testing — thinking_level made no difference, so it's demand/
      // queueing on that specific model, not reasoning cost. flash-lite
      // returned the identical extraction on our test photo in ~4s.
      model: "gemini-3.5-flash-lite",
      input: [
        { type: "text", text: EXTRACTION_PROMPT },
        { type: "image", data: base64, mime_type: mimeType },
      ],
      generation_config: {
        thinking_level: "low",
      },
    });

    console.log(
      `[scan] ${Date.now() - startedAt}ms — thought_tokens=${interaction.usage?.total_thought_tokens ?? "?"} output_tokens=${interaction.usage?.total_output_tokens ?? "?"}`
    );

    const outputText = interaction.output_text ?? "";
    let extraction: ExtractionResult;
    try {
      extraction = parseModelJson(outputText);
    } catch {
      return NextResponse.json(
        {
          error: "Model did not return valid JSON.",
          raw: outputText,
        },
        { status: 502 }
      );
    }

    const match = await matchExtraction(extraction);

    if (match.verdict === "not_found") {
      // Awaited (with its own internal timeout) rather than true
      // fire-and-forget — on serverless, the function can be frozen the
      // instant we respond, which would kill an un-awaited request.
      await notifyUnregistered({ extraction, match, imageBase64: base64, mimeType });
    }

    return NextResponse.json({ extraction, match });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Gemini request failed: ${message}` },
      { status: 502 }
    );
  }
}
