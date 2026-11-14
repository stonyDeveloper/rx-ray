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

/**
 * A typed registration number is still a real verification input — it just
 * carries no photo evidence. Everything except the number is explicitly
 * not_visible so the matcher (and the UI) never pretends otherwise.
 */
function extractionFromNumber(regNo: string): ExtractionResult {
  const nil = { value: null, confidence: "not_visible" as const };
  return {
    product_name: { ...nil },
    nafdac_reg_no: { value: regNo, confidence: "clear" },
    batch_no: { ...nil },
    expiry_date: { ...nil },
    manufacturer: { ...nil },
  };
}

const REG_NO_PATTERN = /^[A-Z0-9][A-Z0-9/-]{2,23}$/;

async function handleManual(body: unknown) {
  const raw =
    typeof (body as { registrationNumber?: unknown })?.registrationNumber === "string"
      ? ((body as { registrationNumber: string }).registrationNumber ?? "").trim()
      : "";

  if (!raw) {
    return NextResponse.json(
      { error: "Enter a registration number." },
      { status: 400 }
    );
  }

  // Keep the printed dash (04-1928), drop spaces, normalise case.
  const compact = raw.toUpperCase().replace(/\s+/g, "");

  if (!REG_NO_PATTERN.test(compact)) {
    return NextResponse.json(
      {
        error:
          "That doesn't look like a NAFDAC registration number. Use the characters printed after “NAFDAC Reg. No”, for example 04-1928 or A4-100160.",
      },
      { status: 400 }
    );
  }

  const extraction = extractionFromNumber(compact);
  const match = await matchExtraction(extraction);

  // Typed numbers are never auto-reported: a single mistyped digit would file
  // a false report. The user can report explicitly from the result screen.
  return NextResponse.json({
    extraction,
    match,
    source: "manual",
    reported: false,
  });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    return handleManual(body);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY is not set on the server. You can still check a pack by entering its registration number manually.",
      },
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

    // Photo scans of an absent number are reported automatically; the result
    // tells the user whether that actually reached the reporting channel.
    const reported =
      match.verdict === "not_found"
        ? await notifyUnregistered({
            extraction,
            match,
            source: "auto",
            imageBase64: base64,
            mimeType,
          })
        : false;

    return NextResponse.json({
      extraction,
      match,
      source: "photo",
      reported,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Gemini request failed: ${message}` },
      { status: 502 }
    );
  }
}
