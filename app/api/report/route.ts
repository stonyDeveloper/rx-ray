import { NextRequest, NextResponse } from "next/server";
import { notifyUnregistered } from "@/lib/notify";
import type { ExtractionResult, MatchResult } from "@/lib/match";

export const runtime = "nodejs";

const REPORTABLE: MatchResult["verdict"][] = ["partial", "not_found"];

/**
 * Explicit user-initiated report. Separate from /api/scan on purpose: a typed
 * number or a partial match should only be filed when the person confirms it,
 * not silently.
 */
export async function POST(req: NextRequest) {
  let body: {
    extraction?: ExtractionResult;
    match?: MatchResult;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { extraction, match } = body;

  if (!extraction || !match || !match.verdict) {
    return NextResponse.json(
      { error: "Missing the scan result to report." },
      { status: 400 }
    );
  }

  if (!REPORTABLE.includes(match.verdict)) {
    return NextResponse.json(
      { error: "Only a partial match or an unregistered number can be reported." },
      { status: 400 }
    );
  }

  const delivered = await notifyUnregistered({
    extraction,
    match,
    source: "user",
  });

  return NextResponse.json({ delivered });
}
