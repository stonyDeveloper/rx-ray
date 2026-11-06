# Rx-Ray

**See through every pack.**

Photograph a medicine pack. Rx-Ray reads the NAFDAC registration number printed on it, checks that number against NAFDAC's public Greenbook, and tells you exactly what it could verify — and what it couldn't.

Built as a capstone project by **Team Nexascale**.

---

## Why Rx-Ray exists

Nigeria has a counterfeit-medicine problem, and most "verify your drug" tools respond to it with a green tick or a red cross. Neither is honest: a registration number proves that a product was registered — not that the pack in your hand is genuine, and not that the medicine is safe.

Rx-Ray is built around a single rule: **never guess.** Every field is marked `clear`, `uncertain`, or `not_visible`. A result is one of four outcomes, each describing only what the data supports.

| Verdict | What it means |
| --- | --- |
| **Registered & active** | The number exists in the Greenbook, its status is Active, and the printed name is consistent. This confirms the *registration*, not the contents of the pack. |
| **Partial match** | Something matched and something didn't — the registration is inactive, belongs to a different product, or only the name matched. The result says which. |
| **Not in the register** | The number was read clearly and is absent from the register. A strong signal, not proof. |
| **Needs a better photo** | Nothing usable was read. That is a capture problem, not a verdict. |

### What it checks

- ✅ The registration number exists — exact match against the Greenbook, across every NAFDAC product category.
- ✅ The registration is current — the entry's Active/Inactive status is shown, never smoothed over.
- ✅ The printed name is consistent — fuzzy name matching, reported as partial when it is only partial.
- ⏳ Recalls and safety alerts — the feed is **not connected yet**, and no result claims otherwise.
- ❌ Batch authenticity — the public register carries no batch-level or serial data.
- ❌ Whether the medicine itself is genuine — a real number can be printed on a counterfeit pack.

> A result describes registration status only. It is not a statement that a medicine is safe, effective, or genuine, and it is not medical advice.

---

## How it works

```
photo ──▶ Gemini vision ──▶ extraction (5 fields + confidence)
                                    │
                                    ▼
                         exact reg-no lookup ──▶ name fallback
                                    │
                                    ▼
                        four-outcome verdict + reason
```

1. **Capture** — the user takes or uploads a photo of the pack (`/scan`).
2. **Extract** — `@google/genai` reads five fields: product name, NAFDAC registration number, batch number, expiry date, and manufacturer. The prompt forbids inferring or correcting anything that is not legible, and each field is tagged with a confidence level.
3. **Match** — the registration number is looked up exactly (normalized: trimmed, uppercased, spaces removed) against the local Greenbook snapshot. If the number is missing, a distinctive-word name match is used as *supporting evidence only*.
4. **Verdict** — the UI explains what matched, what didn't, and why.

### Matching rules

The interesting logic lives in [`lib/match.ts`](lib/match.ts):

- A registration number is the **only** field that can confirm a product.
- Name matching ignores generic dosage/ingredient words ("tablet", "injection", "paracetamol", …). At least one *distinctive* word must overlap before a name match is considered at all.
- When several rows share a registration number, the best name agreement wins, then the most recent approval — making the result deterministic.
- When two different products tie on name similarity, the result is **Partial**, not an arbitrary pick. Naming one would be exactly the false certainty this tool exists to avoid.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Motion | GSAP + ScrollTrigger, Lenis, Motion |
| Database | SQLite (Prisma 7 + `@prisma/adapter-better-sqlite3`) |
| Vision | Google Gemini (`@google/genai`) |
| Reporting | n8n webhook (optional) |

---

## Project structure

```
app/
  layout.tsx              root layout, fonts, motion providers
  page.tsx                landing page (reads live stats from the snapshot)
  globals.css             design tokens, type helpers, motion primitives
  scan/page.tsx           scan screen
  api/scan/route.ts       POST /api/scan — extraction + matching
components/               landing sections, ScanTool, CameraCapture, shared UI
lib/
  match.ts                verdict + matching logic (pure, no UI)
  notify.ts               optional n8n webhook for unregistered packs
  prisma.ts               Prisma client singleton (SQLite driver adapter)
prisma/
  schema.prisma           GreenbookProduct, RecallAlert
  dev.db                  committed Greenbook snapshot (see "Data")
  migrations/             SQL migrations
scripts/
  sync-greenbook.ts       pull the full register into SQLite
  check-one.ts            inspect candidate products in the local snapshot
generated/prisma/         Prisma client output (generated, not committed)
```

---

## Getting started

### Prerequisites

- **Node.js 20.9+** (22 LTS recommended) and npm
- A **Google Gemini API key** — <https://aistudio.google.com/apikey>
- No external database needed: the SQLite snapshot ships with the repo.

### 1. Install

```bash
npm install
```

`postinstall` runs `prisma generate`, which writes the client to `generated/prisma/`.

### 2. Configure environment

```bash
cp .env.example .env.local
```

Then fill in the values:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Reads pack labels in `POST /api/scan`. |
| `DATABASE_URL` | Yes | SQLite path. Keep the default `file:./prisma/dev.db`. |
| `N8N_FLAGGED_WEBHOOK_URL` | No | Webhook that receives reports for packs whose number is not in the register. Leave empty to disable. |

### 3. Run

```bash
npm run dev
```

Open <http://localhost:3000>. The landing page and scan tool are server-rendered on demand so the register stats are always read from the local database.

> If the register stats show `0`, the snapshot is missing. Run `npm run db:sync` (see below) or check that `prisma/dev.db` exists.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Production build (also type-checks). |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run db:generate` | Regenerate the Prisma client. |
| `npm run db:migrate` | Create/apply a dev migration. |
| `npm run db:push` | Push the schema without a migration (prototyping). |
| `npm run db:sync` | Re-download the full NAFDAC Greenbook into `prisma/dev.db`. |
| `npm run db:check` | Print a handful of well-known Active products for testing. |

---

## Data

### Where it comes from

Everything is sourced from NAFDAC's own public register at <https://greenbook.nafdac.gov.ng/>. The site serves its search table through a public (undocumented) DataTables-style JSON endpoint; `scripts/sync-greenbook.ts` pages through it in chunks of 2,000, upserts on `product_id`, and **prunes rows the source no longer returns** (withdrawals and merges upstream).

Deliberate choices:

- **No category filter.** A registration number can belong to drugs, food, cosmetics, devices, or veterinary products. Filtering to "drugs" would make legitimate non-drug packs look unregistered.
- **A committed snapshot.** The app reads a local SQLite file, so it works offline and on serverless hosting. The trade-off is freshness: a snapshot can lag the live register by days, and the UI always shows the snapshot date.

The committed snapshot currently holds ~9,000 registrations (≈5,900 Active) across drugs, herbals, medical devices, biologics, and veterinary products.

### Refreshing the snapshot

```bash
npm run db:sync
```

The script prints progress and prunes stale rows when it finishes. Review the diff, then commit the updated `prisma/dev.db` together with your change — it is a binary file, so keep sync commits isolated and infrequent.

### Schema

- `GreenbookProduct` — one row per register entry. `normalizedRegNo` is indexed for exact lookups; `syncedAt` marks the most recent successful sync.
- `RecallAlert` — reserved for the recall feed (not populated yet).

---

## API

### `POST /api/scan`

`multipart/form-data` with a single `image` file (JPEG/PNG, max **12 MB**).

```bash
curl -X POST http://localhost:3000/api/scan \
  -F "image=@pack.jpg"
```

Success (`200`):

```json
{
  "extraction": {
    "product_name": { "value": "Augmentin 625 mg", "confidence": "clear" },
    "nafdac_reg_no": { "value": "04-1928", "confidence": "clear" },
    "batch_no": { "value": null, "confidence": "not_visible" },
    "expiry_date": { "value": null, "confidence": "not_visible" },
    "manufacturer": { "value": "GlaxoSmithKline", "confidence": "uncertain" }
  },
  "match": {
    "verdict": "registered",
    "reason": "Reg. number 04-1928 is Active in the Greenbook, and the printed details are consistent with …",
    "matchedProduct": {
      "productName": "Augmentin 625mg Tablet",
      "regNo": "04-1928",
      "applicantName": "GlaxoSmithKline …",
      "status": "Active",
      "categoryName": "Drugs"
    }
  }
}
```

Errors: `400` no image, `413` image too large, `500` missing API key, `502` model request or JSON-parse failure.

### Reporting unregistered packs

When the verdict is `not_found`, `lib/notify.ts` posts the extracted fields and the photo (base64) to `N8N_FLAGGED_WEBHOOK_URL` with a 5-second timeout. The call is awaited on purpose: on serverless, an un-awaited request can be frozen the moment the response is sent. If the variable is unset, reporting is a no-op.

**Privacy note:** photos are sent to Google's Gemini API for extraction, and — only for an unregistered pack — forwarded to the configured webhook.

---

## Deploying to Vercel

The project is Vercel-ready. The SQLite snapshot is bundled into the serverless functions via `outputFileTracingIncludes` in `next.config.ts`, and the client opens it **read-only** in production (Vercel's filesystem is read-only outside `/tmp`).

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project** and import the repo.
3. Add the environment variables (Production and Preview):
   - `GEMINI_API_KEY` — your key
   - `DATABASE_URL` — `file:./prisma/dev.db`
   - `N8N_FLAGGED_WEBHOOK_URL` — optional
4. Deploy. The default install command runs `postinstall` → `prisma generate`; the build is `npm run build`.

### What to know about SQLite on Vercel

- The database is a **read-only snapshot**. The app never writes to it, so this is fine.
- To update the data, run `npm run db:sync` locally, commit the new `prisma/dev.db`, and redeploy.
- If the product needs **live** register data or scan logging, move to a hosted database (Postgres, Turso/libSQL, or Prisma Postgres). That is the biggest open infrastructure task — see the roadmap.
- `better-sqlite3` is a native module; it is already on Next.js's default server-external list, so no extra bundler config is required.

---

## Contributing

Contributions are welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, branching, commit, and review conventions. In short:

1. Branch from `main`: `feat/recall-feed`, `fix/name-matching`, `docs/setup`.
2. Keep changes small and focused; run `npm run typecheck`, `npm run lint`, and `npm run build` before opening a PR.
3. Never commit `.env.local`, keys, or anything in `generated/`.
4. For UI changes, include a before/after screenshot in the PR.

Good first issues:

- Unit tests for `lib/match.ts` — it is pure logic with clear branches.
- Rate limiting and abuse protection on `POST /api/scan`.
- Accessibility pass on the camera modal and scan readout.
- Wire the recall feed into `RecallAlert` and the "Partial / recall" outcome.
- Localize the interface (Nigerian English, Pidgin, Hausa, Yoruba, Igbo).

---

## Roadmap

- [ ] Recall & safety-alert feed (the `RecallAlert` model is waiting for it).
- [ ] n8n → LASCOPA reporting workflow, end to end.
- [ ] Hosted database for live data and scan telemetry.
- [ ] Automated tests (matcher, API contract, accessibility).
- [ ] Scan history and an admin view for flagged packs.

---

## Credits

- Register data: [NAFDAC Greenbook](https://greenbook.nafdac.gov.ng/).
- Built by **Team Nexascale** as a capstone project.

Rx-Ray is an independent project and is not affiliated with or endorsed by NAFDAC.
