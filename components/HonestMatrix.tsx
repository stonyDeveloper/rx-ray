import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "./Container";
import Reveal from "./Reveal";

const ROWS = [
  {
    claim: "The registration number exists",
    status: "checked" as const,
    note: "Exact match against NAFDAC's Greenbook, across every product category.",
  },
  {
    claim: "The registration is current",
    status: "checked" as const,
    note: "The entry's Active or Inactive status is shown, never smoothed over.",
  },
  {
    claim: "The printed name is consistent",
    status: "checked" as const,
    note: "Fuzzy name match, and we say plainly when it is only partial.",
  },
  {
    claim: "The pack appears in a recall",
    status: "pending" as const,
    note: "The recall feed is not connected yet. We will not imply that it is.",
  },
  {
    claim: "The batch number is authentic",
    status: "cannot" as const,
    note: "The public register carries no batch-level or serial data.",
  },
  {
    claim: "The medicine itself is genuine",
    status: "cannot" as const,
    note: "A real registration number can be printed on a counterfeit pack. Only the pack's maker can close that gap.",
  },
];

const STATUS = {
  checked: { label: "Checked", dot: "bg-clinical", text: "text-clinical" },
  pending: { label: "Not yet", dot: "bg-warn", text: "text-warn" },
  cannot: { label: "Cannot", dot: "bg-muted", text: "text-muted" },
};

export default function HonestMatrix() {
  return (
    <section id="checks" className="border-t border-rule bg-paper-2 py-24 md:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow text-clinical">What we check</p>
            <h2 className="display mt-4 text-[clamp(2.4rem,4.4vw,3.9rem)]">
              A scan is not a verdict
              <br />
              on the <em>medicine.</em>
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-soft">
              Most checkers promise authenticity. We can&apos;t — the public data
              doesn&apos;t contain it — so we don&apos;t pretend to. Here is
              exactly where the line sits.
            </p>
            <Link
              href="/scan"
              className="mt-8 inline-flex items-center gap-2 text-[13px] font-medium text-ink underline decoration-rule-strong underline-offset-4 transition-colors hover:text-clinical"
            >
              Check a pack
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="border border-rule bg-paper">
              <div className="hidden grid-cols-[1.35fr_auto_1.9fr] items-center gap-6 border-b border-rule px-5 py-3 md:grid">
                <span className="eyebrow text-muted">Assumption</span>
                <span className="eyebrow text-muted">Rx-Ray</span>
                <span className="eyebrow text-muted">Why</span>
              </div>

              <ul>
                {ROWS.map((row) => {
                  const status = STATUS[row.status];
                  return (
                    <li
                      key={row.claim}
                      className="grid gap-2 border-b border-rule px-5 py-4 last:border-b-0 md:grid-cols-[1.35fr_auto_1.9fr] md:items-baseline md:gap-6 md:py-5"
                    >
                      <span className="text-[13.5px] font-medium leading-snug">
                        {row.claim}
                      </span>
                      <span className="flex items-center gap-2 md:justify-start">
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        <span className={`eyebrow ${status.text}`}>{status.label}</span>
                      </span>
                      <span className="text-[12.5px] leading-relaxed text-ink-soft">
                        {row.note}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
