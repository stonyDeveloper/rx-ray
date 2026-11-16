# Rx-Ray

### See through every pack.

**One-pager · Team Nexascale capstone**

---

## The problem

Nigeria's medicine market includes counterfeit, substandard and expired products. A consumer has no quick way to check a pack, and most "verify your drug" tools return a green tick or a red cross that the data cannot support. A NAFDAC registration number proves a product was registered — not that the pack in your hand is genuine.

## What we built

Rx-Ray is a web app that checks a medicine pack against NAFDAC's public Greenbook. Photograph the pack — or type the number if the print is worn — and it returns one of four outcomes:

| Outcome | What it means |
|---|---|
| **Registered & active** | The number exists, is current, and the printed name is consistent. Confirms the registration, not the contents. |
| **Partial match** | Something matched and something didn't — inactive registration, different product, or name only. The result says which. |
| **Not in the register** | The number was read clearly and is absent from the register. A strong signal, not proof. |
| **Needs a better photo** | Nothing usable was read. A capture problem, not a verdict. |

Every result explains what was checked, how confident the reading was, and what to do next. No "fake" badge, no "genuine" badge.

## How it works

1. **Capture** — photo or typed number.
2. **Read** — Gemini extracts five fields (product, registration, batch, expiry, manufacturer), each marked clear, uncertain or not visible. The prompt forbids guessing.
3. **Match** — exact registration lookup across every NAFDAC category; names are supporting evidence only.
4. **Verdict** — one of four outcomes, with a reason and a next step.

**AI reads, the register decides.** The model cannot produce a "verified" result on its own, so its worst failure is "needs a better photo", not a false confirmation.

## What a scan can and cannot tell you

| Question | Rx-Ray |
|---|---|
| Is the registration number real? | Yes — exact match |
| Is it current? | Yes — Active/Inactive shown |
| Does the printed name match? | Yes — partial results disclosed |
| Is the pack in a recall? | Not yet |
| Is the batch authentic? | No — no batch data in the register |
| Is the medicine genuine? | No — a real number can be printed on a fake pack |

## The data

The full public Greenbook: **8,974 registrations** across five categories (drugs, vaccines, devices, veterinary, herbals), **5,936 Active**. The build ships a snapshot last synced **6 November 2026**; every scan shows that date. The sync upserts every row and prunes records the source no longer returns.

## Why it is different

- **No false certainty** — designed around what the data supports.
- **AI for perception, not judgement** — the model reads; a deterministic matcher decides.
- **Manual entry** — a worn label is not a dead end.
- **Honest reporting** — "reported" only when a report was actually delivered.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind 4 · Prisma 7 + SQLite · Gemini 3.5 Flash Lite · GSAP + Lenis · n8n-ready webhook.

## Status

Live: photo scanning, manual entry, four verdicts, next steps, reporting. Next: recall feed, hosted data, n8n workflow.

---

**Team Nexascale** · Capstone project · Independent, not affiliated with NAFDAC.
