# Rx-Ray — User Guide

Rx-Ray checks a medicine pack against NAFDAC's public register, the Greenbook. It tells you what it could verify, what it couldn't, and what to do next. It does not tell you whether a medicine is safe or genuine.

---

## Before you start

You need:

- A phone, tablet or computer with a browser and an internet connection.
- The medicine pack, with the printed panel facing you.
- Good light and a steady hand (or the registration number, typed by hand).

You do **not** need an account, and there is nothing to install.

---

## Two ways to check a pack

On the **Scan a pack** screen, use the switch at the top of the **Specimen** panel:

- **Photo** — take or upload a picture of the pack.
- **Number** — type the NAFDAC registration number yourself.

Use **Number** when the print is worn, the light is bad, the camera won't focus, or the pack is already open and flat.

---

## Option A — Check with a photo

1. Open **Scan a pack**.
2. Make sure **Photo** is selected.
3. Choose **Use camera** to take a picture, or **Upload photo** to pick one from your device.
4. Fill the frame with the **NAFDAC Reg. No.** panel. Keep it flat, well lit, and in focus. Avoid glare and shadows.
5. Wait a few seconds while Rx-Ray reads the pack. The right-hand panel shows **Reading the pack**.
6. Read your result in the **Readout** panel.

Tips:

- One sharp photo of the number beats five blurry ones.
- If the number is on a side panel or flap, photograph that panel directly.
- If the result says **Needs a better photo**, retake it — or switch to **Number** and type it.

---

## Option B — Type the number

1. Open **Scan a pack** and select **Number**.
2. Type the registration number exactly as printed after **"NAFDAC Reg. No"** or **"NRN"**. Keep the dash: `04-1928`, not `041928`.
3. Select **Check this number**.
4. Read your result. The screen marks the input as **Entered manually** and notes that no photo was read.

Manual entry checks the number only. Batch, expiry and manufacturer stay unknown — nothing is invented to fill the gap.

---

## Reading your result

### The four outcomes

| Verdict | What it means |
|---|---|
| **Registered & active** | The number exists in the register, its status is Active, and the printed name is consistent. This confirms the registration — not the batch, and not that the medicine is genuine. |
| **Partial match** | Something matched and something didn't: the registration is inactive, belongs to a different product, or only the name matched. The reason says which. |
| **Not in the register** | The number was read clearly and is absent from the register. Treat the pack as unverified. |
| **Needs a better photo** | Nothing usable was read. This is a capture problem, not a verdict. |

### The register entry

When there is a match, Rx-Ray shows the entry it found: product name, registration number, status (Active or Inactive), category, and the applicant/manufacturer on the register. Compare it with the pack in your hand.

### Fields read

For photo scans, Rx-Ray lists the five fields it looked for and marks each one:

- **Clear** — confidently read.
- **Uncertain** — partially visible; check it yourself.
- **Not visible** — not in frame, illegible, or absent.

A field marked **not visible** is never filled in. That is intentional.

### Entered manually

For typed checks, the panel shows the number you entered and states that no photo was read. Only the number was checked.

---

## What to do next

Every result includes a **What to do next** section:

| Result | Suggested action |
|---|---|
| **Registered & active** | The registration is current. That does not confirm the batch or that the medicine is genuine. If anything looks off — print quality, seals, where you bought it — ask a pharmacist. |
| **Partial match** | Don't rely on this pack. Check the number again, show it to a pharmacist, and report it if you are still unsure. |
| **Not in the register** | Double-check the number for a typo. If it is correct, do not use the pack — report it and keep the packaging. |
| **Needs a better photo** | Retake the photo flat and well lit, with the number filling the frame — or enter the number by hand. |

---

## Reporting a pack

When a result is **Partial match** or **Not in the register**, select **Report this pack**.

- If the reporting channel is connected, Rx-Ray sends the result and shows **Reported**.
- If it is not connected in your build, Rx-Ray says so and offers **Copy report details**, which copies the product, registration number, batch, expiry, manufacturer, verdict and reason so you can send them to the authorities yourself.

Photos of an unregistered pack may be reported automatically when the reporting channel is configured. Numbers you type yourself are never reported automatically.

### Official reporting contacts

**NAFDAC** (the regulator for medicines)

- Complaints: **0800-1-623322** (toll-free)
- Email: **reforms@nafdac.gov.ng**
- Online complaint form and the Med Safety app/web: [nafdac.medsafety.io](https://nafdac.medsafety.io/)

**LASCOPA** (Lagos State Consumer Protection Agency)

- Toll-free: **080 0005 2726**
- Email: **lascopa@lagosstate.gov.ng**

---

## Troubleshooting

| Problem | What to do |
|---|---|
| The camera won't open | Allow camera access in your browser, or use **Upload photo**. On a laptop without a camera, upload a picture instead. |
| The photo is rejected as too large | Use a smaller photo (under 12 MB) or take a new one at a lower resolution. |
| "Needs a better photo" | Retake it flat and well lit, with the number filling the frame, or switch to **Number**. |
| The number is worn off | Type the digits you can see. If none are readable, ask a pharmacist — do not guess a number. |
| "Not in the register" but I think it's real | Check the digits against the pack. Registrations can lapse or be renamed, so an inactive or missing entry is not automatically proof of a fake. Ask a pharmacist and report it. |
| The page won't load | Check your internet connection and try again. Rx-Ray needs the network to reach the register. |
| The report button says it isn't connected | Use **Copy report details** and send them to NAFDAC or LASCOPA using the contacts above. |

---

## Privacy and limits

- Photos are sent to Google's Gemini API so the model can read the label. Rx-Ray does not keep a copy of your photo.
- No account, no scan history, and no personal details are required.
- If a report is sent, the extracted fields — and, when available, the photo — are forwarded to the configured reporting channel.
- A result describes **registration status only**. It is not a statement that a medicine is safe, effective or genuine, and it is not medical advice.
- The register is a snapshot. The date it was last synced is shown on every scan screen.

---

Questions? See the separate **FAQ** document.
