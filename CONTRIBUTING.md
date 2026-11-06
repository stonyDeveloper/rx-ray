# Contributing to Rx-Ray

Thanks for helping. Rx-Ray is a small, opinionated codebase: **never overclaim** is a product rule, not just a copy guideline. Keep that in mind in both code and UI text.

## Set up

```bash
git clone <repo-url>
cd rx-ray
npm install
cp .env.example .env.local   # add your GEMINI_API_KEY
npm run dev
```

You do not need an external database — the Greenbook snapshot is committed at `prisma/dev.db`. If you want to refresh it, run `npm run db:sync` (takes a few minutes and needs network access to `greenbook.nafdac.gov.ng`).

Before you start, run:

```bash
npm run typecheck
npm run lint
npm run build
```

## Branches and commits

- Branch from `main`. Use a descriptive prefix:
  - `feat/recall-feed`
  - `fix/name-matching`
  - `docs/setup-guide`
  - `chore/deps`
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat(scan): show batch number in the readout`
  - `fix(match): require a distinctive word before a name match`
  - `docs: document Vercel environment variables`
- One logical change per commit. Avoid mixing formatting with behaviour.

## Pull requests

Keep PRs small enough to review in one sitting. In the description, cover:

1. **What** changed and **why**.
2. **How to test** it (steps, sample photo, or command).
3. Screenshots or a short recording for any UI change.
4. Anything you deliberately did **not** do (scope).

Checklist before requesting review:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] No secrets, `.env.local`, or `generated/` files in the diff
- [ ] UI copy does not imply a pack is "genuine" or "safe"
- [ ] New matching rules have a comment explaining the trade-off

## Code conventions

- **TypeScript strict mode.** No `any` without a comment explaining why.
- **Server components by default.** Add `"use client"` only where interactivity or browser APIs require it.
- **Tailwind tokens, not raw colours.** Use the CSS variables and Tailwind theme names defined in `app/globals.css` (`text-clinical`, `bg-film`, `border-rule`, …). If a new colour is genuinely needed, add a token instead of hardcoding a hex value.
- **Motion is optional.** Respect `prefers-reduced-motion` — use `usePrefersReducedMotion` and the existing `MotionConfig`.
- **Matching logic stays pure.** `lib/match.ts` takes an extraction and returns a verdict; keep database access at that boundary and UI out of it.
- **Error text is user-facing.** Say what happened and what to do next; never blame the user.

## Working with the register

`prisma/dev.db` is a generated snapshot of NAFDAC's public Greenbook. Treat it as data, not source:

- Don't edit it by hand.
- Refresh it with `npm run db:sync`.
- Commit a refreshed snapshot in its **own commit** (`chore(data): refresh Greenbook snapshot`) so reviewers can skip the binary blob.
- If the schema changes, add a migration (`npm run db:migrate`) and regenerate the client.

## Privacy and safety

- Photos go to Google's Gemini API. Do not add features that upload images anywhere else without updating the privacy note in the footer and README.
- Never log base64 image payloads or API keys.
- A registration check is not medical advice. Keep the disclaimer visible wherever a verdict is shown.

## Ideas to pick up

Check the roadmap in the README, or start with one of these:

- Tests for `lib/match.ts` (highest-value first contribution).
- Rate limiting on `POST /api/scan`.
- Recall feed ingestion into `RecallAlert`.
- Accessibility review of the camera modal.
- Localization (Pidgin, Hausa, Yoruba, Igbo).

If you're unsure where something belongs, open an issue and ask before building a large change.
