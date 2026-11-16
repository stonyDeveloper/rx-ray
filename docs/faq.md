# Rx-Ray — FAQ

---

## The basics

### What is Rx-Ray?

A web app that checks a medicine pack against NAFDAC's public register, the Greenbook. You photograph the pack — or type its registration number — and Rx-Ray tells you what the register can confirm, what it can't, and what to do next.

### Who is it for?

Anyone buying or handling medicines in Nigeria: consumers, pharmacists, patent medicine vendors, clinic staff, and inspectors who need a quick first check.

### Is it free?

Yes. It is a capstone project, not a commercial product.

### Do I need an account?

No. There is no sign-up, no scan history, and no personal profile.

---

## Verdicts

### What do the four verdicts mean?

- **Registered & active** — the number exists, is current, and the printed name is consistent.
- **Partial match** — something matched and something didn't; the reason says which.
- **Not in the register** — the number was read clearly and is absent from the register.
- **Needs a better photo** — nothing usable was read; this is a capture problem, not a verdict.

### Why doesn't it just say "genuine" or "fake"?

Because the data cannot support that claim. A registration number proves a product was registered — not that the pack in your hand is genuine. Counterfeiters can print a real, valid number. Saying "genuine" would be false certainty; saying "fake" on a missing number would be worse.

### A well-known brand showed as "Inactive". Is it fake?

Not necessarily. "Inactive" is the register's status for that entry. It can mean a lapsed, withdrawn or renamed registration. Rx-Ray shows the status rather than hiding it, and you should treat the pack as unverified and ask a pharmacist.

### Why is my result only a "Partial match"?

Usually one of three things: the number is registered but its status is Inactive, the number belongs to a different product, or only the product name matched because the number wasn't legible. The reason line under the verdict says which one applies.

### It says "Not in the register" but I think the medicine is real.

Check the digits against the pack first — a single wrong character changes the result. If the number is correct and absent, treat the pack as unverified: ask a pharmacist, keep the packaging, and report it.

---

## AI and accuracy

### How is AI used?

A vision-language model — Google Gemini 3.5 Flash Lite — reads the photo and extracts five fields: product name, NAFDAC registration number, batch number, expiry date, and manufacturer. Each field is tagged clear, uncertain or not visible.

### Does the AI decide whether the medicine is genuine?

No. The AI only reads. A deterministic matcher checks the number against the register. That separation is deliberate: the model cannot produce a "verified" result on its own, so a bad reading becomes "needs a better photo", not a false confirmation.

### Can the AI hallucinate a registration number?

The prompt forbids guessing, inferring or auto-correcting, and requires a field to be null when it isn't legible. If the model still misreads, the number will usually fail to match the register — which produces a cautious result, not a false tick. The confidence tag tells you when a field was uncertain.

### How accurate is it?

We tested it on real pack photos, including worn packaging where only the product name was legible. We don't publish an accuracy percentage because no labelled benchmark exists for this task. The design assumes the model will sometimes fail, and degrades safely when it does.

### What if the AI can't read the number?

Use the **Number** tab and type the registration number. It goes through the same matcher with no model call, so it works even when the photo is unusable.

---

## Data

### Where does the data come from?

NAFDAC's public Greenbook at [greenbook.nafdac.gov.ng](https://greenbook.nafdac.gov.ng/). Nothing is scraped from unofficial lists or resold databases.

### How current is it?

The build ships a snapshot: **8,974 registrations across five product categories**, **5,936 Active**, last synced **6 November 2026**. The date is shown on every scan screen. The register changes — entries are added, withdrawn and renamed — so a snapshot can lag the live register by days.

### Can I refresh it?

Yes. Running `npm run db:sync` pulls the full register, upserts every row, and prunes records the source no longer returns.

### Does it check recalls?

Not yet. The recall and safety-alert feed is the next piece of work. No result claims a recall was checked.

### Does it check the batch number or expiry date?

It reads and displays the batch and expiry if they are visible, but it does not validate them. The public register has no batch-level or serial data, so any tool claiming batch-level verification from this source is overstating it.

### Does it cover food, cosmetics and medical devices?

The register sync covers all NAFDAC product categories, including medical devices, veterinary products, vaccines and herbals. Rx-Ray checks **registration status**, not whether a product is suitable for a particular use.

---

## Privacy

### What happens to my photo?

It is sent to Google's Gemini API so the model can read the label. Rx-Ray does not store a copy. If you send a report and a reporting channel is configured, the extracted fields — and, when available, the photo — are forwarded to that channel.

### Do you keep my scans?

No. There is no scan history and no account. Each check is a one-off request.

### Is my data sold or shared?

No. The only third party involved in a scan is the model provider.

---

## Reporting

### How do I report a suspicious pack?

On a **Partial match** or **Not in the register** result, select **Report this pack**. If the reporting channel isn't connected in your build, use **Copy report details** and send them to NAFDAC or LASCOPA.

### Where do reports go?

The reporting path is designed for NAFDAC, the regulator for medicines, with LASCOPA as the Lagos consumer-protection route. Nothing is sent unless a reporting channel is configured.

### Why does the button say "not connected"?

Because the app won't claim a report was sent when it wasn't. When no reporting webhook is configured, it says so and gives you the details to send yourself. That is the project's honesty rule applied to reporting.

### Are typed numbers reported automatically?

No. A single mistyped digit could file a false report. Typed numbers are only reported when you choose to report them.

### Do you report every scan?

No. Only results that are **Partial match** or **Not in the register**, and only when a reporting channel is configured — or when you explicitly report.

---

## Practical

### Does it work offline?

No. The app needs an internet connection to load and to reach the model. Manual entry skips the model, but it still needs the app and its register.

### Can I check more than one pack?

Yes. After a result, select **Check another** and scan or type the next one.

### Does it work outside Nigeria?

The web app loads anywhere, but the register contains Nigerian NAFDAC registrations, so it is only meaningful for products sold in Nigeria.

### Is this medical advice?

No. It describes registration status only. It is not a statement that a medicine is safe, effective or genuine, and it does not replace a pharmacist or a doctor.

---

## The project

### Who built it?

Team Nexascale, as a capstone project. Rx-Ray is independent and is not affiliated with or endorsed by NAFDAC.

### What is it built with?

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma 7 with SQLite, Google Gemini 3.5 Flash Lite, GSAP and Lenis, and an n8n-ready reporting webhook.

### What's next?

The recall and safety-alert feed, a hosted database for live register data, the n8n reporting workflow, and localization (Nigerian English, Pidgin, Hausa, Yoruba and Igbo).
