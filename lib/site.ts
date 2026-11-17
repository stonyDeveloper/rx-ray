const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

function withProtocol(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/**
 * Canonical origin for metadata, sitemap and OG images.
 * Set NEXT_PUBLIC_SITE_URL to the custom domain in Vercel; until then, fall
 * back to the production Vercel URL, then to localhost in development.
 */
export const siteUrl = withProtocol(
  configuredUrl ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
).replace(/\/+$/, "");

export const siteName = "Rx-Ray";

export const siteTitle = "Rx-Ray — NAFDAC medicine registration checker";

export const siteDescription =
  "Photograph a medicine pack or type its NAFDAC number. Rx-Ray checks the registration against the Greenbook and shows exactly what's verified — and what isn't.";

export const siteKeywords = [
  "NAFDAC",
  "NAFDAC Greenbook",
  "NAFDAC registration number",
  "medicine verification",
  "check NAFDAC number",
  "counterfeit medicine Nigeria",
  "substandard medicines",
  "drug registration checker",
  "verify medicine pack",
  "medicine authenticity check",
];

export const ogImage = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Rx-Ray — a scan line crossing a medicine pack, with the verdict Registered & active",
};
