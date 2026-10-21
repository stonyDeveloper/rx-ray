import { prisma } from "@/lib/prisma";

export type FieldResult = {
  value: string | null;
  confidence: "clear" | "uncertain" | "not_visible";
};

export type ExtractionResult = {
  product_name: FieldResult;
  nafdac_reg_no: FieldResult;
  batch_no: FieldResult;
  expiry_date: FieldResult;
  manufacturer: FieldResult;
};

/**
 * Four outcomes, deliberately not "real / fake":
 *  - registered  the number exists, is Active, and the name is consistent
 *  - partial     something matched, something else didn't — we say which
 *  - not_found   the number was read clearly and is absent from the register
 *  - unreadable  nothing usable was read; this is a capture problem, not a verdict
 */
export type Verdict = "registered" | "partial" | "not_found" | "unreadable";

export type MatchedProduct = {
  productName: string;
  regNo: string;
  applicantName: string;
  status: string;
  categoryName: string;
};

export type MatchResult = {
  verdict: Verdict;
  reason: string;
  matchedProduct: MatchedProduct | null;
};

function normalizeRegNo(raw: string | null): string {
  return (raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeForCompare(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9&\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The Greenbook's own data carries footnote markers ("##", "**", "_") and
 * editorial parentheticals. They are noise in a product name and would hurt
 * both similarity scoring and display, so strip them at the boundary.
 */
export function displayProductName(raw: string): string {
  return raw
    .replace(/\((?:check description|strength format|duplicate[^)]*)\)/gi, "")
    .replace(/[#*_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Dosage forms, routes and generic marketing suffixes that show up across
// hundreds of unrelated Greenbook entries. On their own these words don't
// distinguish one manufacturer's product from another's — matching on
// "paracetamol injection" alone would tie with every brand's paracetamol
// injection in the registry. They still count toward the similarity score,
// but at least one *non-generic* word must also overlap for a match to be
// considered at all, so we're not confidently naming a brand based purely on
// the drug form.
const GENERIC_WORDS = new Set([
  "tablet", "tablets", "capsule", "capsules", "injection", "infusion",
  "syrup", "suspension", "solution", "cream", "ointment", "gel", "drops",
  "lotion", "powder", "sachet", "sachets", "paracetamol", "forte", "plus",
  "extra", "advance", "gold", "premium", "mild", "oral", "nasal",
]);

function significantWords(raw: string): string[] {
  return normalizeForCompare(raw)
    .split(" ")
    .filter((w) => w.length >= 4);
}

// Overlap of significant (4+ char) words, as a fraction of the extracted
// name's own words. Cheap, no external library, good enough for a candidate
// set already narrowed down by a SQL `contains` filter.
function nameSimilarity(a: string, b: string): number {
  const wordsA = significantWords(a);
  const wordsB = new Set(significantWords(b));
  if (wordsA.length === 0) return 0;
  const hits = wordsA.filter((w) => wordsB.has(w)).length;
  return hits / wordsA.length;
}

// A match only counts as meaningful if at least one of the overlapping
// words is a real, distinguishing word — not just a shared dosage form or
// the drug's own generic ingredient name.
function hasDistinctiveOverlap(a: string, b: string): boolean {
  const wordsA = significantWords(a);
  const wordsB = new Set(significantWords(b));
  return wordsA.some((w) => wordsB.has(w) && !GENERIC_WORDS.has(w));
}

type GreenbookRow = {
  productName: string;
  regNo: string;
  applicantName: string;
  status: string;
  categoryName: string;
  approvalDate: Date | null;
};

function toMatchedProduct(row: GreenbookRow): MatchedProduct {
  return {
    productName: displayProductName(row.productName),
    regNo: row.regNo,
    applicantName: row.applicantName,
    status: row.status,
    categoryName: row.categoryName,
  };
}

export async function matchExtraction(
  extraction: ExtractionResult
): Promise<MatchResult> {
  const regField = extraction.nafdac_reg_no;
  const nameField = extraction.product_name;
  const regNo = regField.value?.trim() ?? "";
  const productName = nameField.value?.trim() ?? "";
  const regUsable = regNo.length > 0 && regField.confidence !== "not_visible";
  const nameUsable = productName.length > 0 && nameField.confidence !== "not_visible";

  // 1. Registration number — the only field that can confirm a product.
  if (regUsable) {
    const rows = await prisma.greenbookProduct.findMany({
      where: { normalizedRegNo: normalizeRegNo(regNo) },
    });

    if (rows.length > 0) {
      // A number can be reused across several published rows (different pack
      // sizes, or source duplicates with different statuses). Rank by name
      // agreement first, then by recency, so the outcome is deterministic
      // instead of depending on row order.
      const scored = rows.map((row) => ({
        row,
        similarity: nameUsable ? nameSimilarity(productName, row.productName) : 1,
      }));

      const active = scored.filter((entry) => entry.row.status === "Active");
      const pool = (active.length > 0 ? active : scored).sort((a, b) => {
        if (b.similarity !== a.similarity) return b.similarity - a.similarity;
        return (b.row.approvalDate?.getTime() ?? 0) - (a.row.approvalDate?.getTime() ?? 0);
      });

      const best = pool[0];
      const name = displayProductName(best.row.productName);

      if (best.row.status !== "Active") {
        return {
          verdict: "partial",
          reason: `This number is registered to "${name}", but its Greenbook status is "${best.row.status}", not Active. That can mean a lapsed, withdrawn or renamed registration.`,
          matchedProduct: toMatchedProduct(best.row),
        };
      }

      if (nameUsable && best.similarity <= 0.3) {
        return {
          verdict: "partial",
          reason: `The number is registered to a different product — "${name}" by ${best.row.applicantName}. Re-check the digits printed on the pack.`,
          matchedProduct: toMatchedProduct(best.row),
        };
      }

      return {
        verdict: "registered",
        reason: `Reg. number ${regNo} is Active in the Greenbook, and the printed details are consistent with "${name}". That confirms the registration — not the contents of the pack.`,
        matchedProduct: toMatchedProduct(best.row),
      };
    }
    // Read clearly but absent: fall through to a name check so we can explain
    // whether the pack at least looks like a registered product.
  }

  // 2. Name fallback — supporting evidence only, never confirmation.
  if (nameUsable) {
    const words = normalizeForCompare(productName)
      .split(" ")
      .filter((w) => w.length >= 4);

    if (words.length > 0) {
      // One query per word rather than a single OR with an arbitrary cap:
      // a broad word like "extra" can otherwise fill the result set and push
      // the one distinguishing word ("panadol") out of it entirely.
      const perWord = await Promise.all(
        words.slice(0, 3).map((word) =>
          prisma.greenbookProduct.findMany({
            where: { productName: { contains: word } },
            take: 40,
          })
        )
      );
      const candidates = [
        ...new Map(perWord.flat().map((row) => [row.id, row])).values(),
      ];

      const ranked = candidates
        .map((candidate) => ({
          candidate,
          score: nameSimilarity(productName, candidate.productName),
        }))
        .filter(
          (entry) =>
            entry.score > 0.4 &&
            hasDistinctiveOverlap(productName, entry.candidate.productName)
        )
        .sort((a, b) => b.score - a.score);

      if (ranked.length > 0) {
        const topScore = ranked[0].score;
        // Different products tied at the top — the name alone cannot tell them
        // apart. Naming one arbitrarily would be the false certainty this tool
        // exists to avoid.
        const tied = new Set(
          ranked
            .filter((entry) => entry.score >= topScore - 0.0001)
            .map((entry) => entry.candidate.regNo)
        );

        if (tied.size > 1) {
          return {
            verdict: "partial",
            reason: `The name matches ${tied.size} different registrations (different manufacturers, different numbers), so it is not enough to tell which one this is. A legible registration number is needed.`,
            matchedProduct: null,
          };
        }

        const best = ranked[0].candidate;
        const name = displayProductName(best.productName);
        const statusNote =
          best.status !== "Active"
            ? ` Note: that entry's Greenbook status is "${best.status}", not Active.`
            : "";
        const reason =
          (regUsable
            ? `The name matches "${name}" (reg. ${best.regNo}), but the number read off this pack ("${regNo}") does not match that entry. Re-check the digits.`
            : `The name matches "${name}" (reg. ${best.regNo}), but no registration number was legible, so this is not confirmation.`) +
          statusNote;

        return {
          verdict: "partial",
          reason,
          matchedProduct: toMatchedProduct(best),
        };
      }
    }
  }

  // 3. Nothing matched at all.
  if (regUsable) {
    return {
      verdict: "not_found",
      reason: `Reg. number "${regNo}" was read clearly but is not in NAFDAC's Greenbook. That is a strong signal, not proof — report the pack and keep the packaging.`,
      matchedProduct: null,
    };
  }

  return {
    verdict: "unreadable",
    reason: nameUsable
      ? "The product name was read, but it doesn't match any entry in the register, and no registration number was legible. Retake with the NAFDAC number filling the frame — the name alone cannot confirm a product."
      : "No registration number or product name could be read from this photo. That is a capture problem, not a verdict — retake it with the NAFDAC number filling the frame.",
    matchedProduct: null,
  };
}
