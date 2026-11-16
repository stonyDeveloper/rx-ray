import { Plus } from "lucide-react";
import Container from "./Container";
import Reveal from "./Reveal";

export type FaqStats = {
  total: number;
  active: number;
  synced: string;
};

export default function Faq({ stats }: { stats: FaqStats }) {
  const total = stats.total.toLocaleString("en-NG");
  const active = stats.active.toLocaleString("en-NG");

  const items = [
    {
      q: "Is Rx-Ray detecting counterfeit medicine?",
      a: "No. It checks whether the registration number on the pack exists in NAFDAC's register and is current. A real number can be printed on a counterfeit pack, so Rx-Ray confirms the registration — never the contents.",
    },
    {
      q: "Why doesn't it just say \u201cgenuine\u201d or \u201cfake\u201d?",
      a: "Because the register can't support that claim. A missing or inactive number is a reason to look closer, not proof of a fake; a valid number is not proof of a genuine pack. Rx-Ray shows what was checked and what wasn't.",
    },
    {
      q: "What do the four verdicts mean?",
      a: "Registered & active: the number exists, is current, and the printed name is consistent. Partial match: something didn't line up — the reason says which part. Not in the register: the number was read clearly and isn't there. Needs a better photo: nothing usable was read, so retake it or type the number.",
    },
    {
      q: "Where does the data come from, and how fresh is it?",
      a: `NAFDAC's public Greenbook, synced in full: ${total} registrations across five product categories, ${active} of them Active. The build's snapshot was last synced ${stats.synced}; the date is shown on every scan result. A snapshot can lag the live register by days.`,
    },
    {
      q: "What if the registration number is worn off?",
      a: "Switch to the Number tab and type what is printed. Manual entry goes through the same lookup with no model call, so bad light or a worn label is not a dead end. If no digits are readable, don't guess — ask a pharmacist.",
    },
    {
      q: "Does it check batch numbers, expiry dates or recalls?",
      a: "It reads and shows the batch and expiry when they are visible, but it doesn't validate them: the public register has no batch-level or serial data. Recalls aren't connected yet, and no result claims they were checked.",
    },
    {
      q: "What happens to my photo?",
      a: "It is sent to Google's Gemini API so the model can read the label. Rx-Ray does not store a copy. If you send a report and a reporting channel is configured, the extracted fields — and, when available, the photo — are forwarded to that channel.",
    },
    {
      q: "Why does the report button say it isn't connected?",
      a: "Because the reporting channel isn't configured in this build, and the app won't claim a report was sent when it wasn't. It offers the report details so you can send them to NAFDAC or LASCOPA yourself.",
    },
    {
      q: "Is this medical advice?",
      a: "No. A result describes registration status only — not whether a medicine is safe, effective or genuine. It doesn't replace a pharmacist, a doctor or the regulator.",
    },
  ];

  return (
    <section id="faq" className="border-t border-rule py-24 md:py-32">
      <Container className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-clinical">FAQ</p>
          <h2 className="display mt-4 text-[clamp(2.4rem,4.2vw,3.9rem)]">
            Questions,
            <br />
            <em>answered plainly.</em>
          </h2>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-soft">
            The limits are part of the product. Here is what people ask before
            trusting a result.
          </p>
          <p className="mt-6 mono text-[10px] uppercase tracking-[0.14em] text-muted">
            No account · No scan history
          </p>
        </div>

        <Reveal>
          <div>
            {items.map((item, index) => (
              <details
                key={item.q}
                className="group border-t border-rule py-5"
                open={index === 0}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 [&::-webkit-details-marker]:hidden">
                  <span className="text-[15px] font-medium leading-snug tracking-tight transition-colors group-hover:text-clinical">
                    {item.q}
                  </span>
                  <Plus
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-45"
                    strokeWidth={1.6}
                  />
                </summary>
                <p className="mt-3 max-w-2xl pr-8 text-[13.5px] leading-relaxed text-ink-soft">
                  {item.a}
                </p>
              </details>
            ))}
            <div className="border-t border-rule" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
