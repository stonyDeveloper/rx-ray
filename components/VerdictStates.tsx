import Container from "./Container";
import Reveal from "./Reveal";

const OUTCOMES = [
  {
    tone: "text-clinical-bright",
    rule: "border-clinical-bright/35",
    label: "Registered & active",
    desc: "The number exists, is current, and the printed name is consistent. That is the strongest claim the register supports — not a guarantee that the medicine is genuine.",
    example: "04-0005 · Active · GlaxoSmithKline",
  },
  {
    tone: "text-warn-bright",
    rule: "border-warn-bright/35",
    label: "Partial match",
    desc: "The number is registered but inactive, or it belongs to a different product, or only the name matched. We name which of those it is.",
    example: "name matched · registration not readable",
  },
  {
    tone: "text-alert-bright",
    rule: "border-alert-bright/35",
    label: "Not in the register",
    desc: "The number was read clearly and is absent from NAFDAC's register. Treat the pack as unverified and report it.",
    example: "04-0000 · no match · 6 Nov 2026",
  },
  {
    tone: "text-bone-dim",
    rule: "border-rule-film",
    label: "Needs a better photo",
    desc: "Nothing usable was read. That is a capture problem, not a verdict — retake it closer, sharper, with the print in frame.",
    example: "0 of 4 fields legible",
  },
];

export default function VerdictStates() {
  return (
    <section className="film-noise border-t border-rule bg-film py-24 text-bone md:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow text-bone-dim">The four outcomes</p>
            <h2 className="display mt-4 text-[clamp(2.4rem,4.4vw,3.9rem)]">
              What you
              <br />
              actually <em>see.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="max-w-md text-sm leading-relaxed text-bone-dim lg:pt-3">
              No green tick that means &ldquo;safe&rdquo;. No red cross that means
              &ldquo;fake&rdquo;. Four states, each describing exactly what the
              data supports — and what it doesn&apos;t.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-px bg-rule-film md:grid-cols-2">
          {OUTCOMES.map((outcome, i) => (
            <Reveal key={outcome.label} delay={i * 0.05}>
              <article className="group h-full bg-film p-7 md:p-9">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className={`font-display text-[1.9rem] leading-none ${outcome.tone}`}>
                    {outcome.label}
                  </h3>
                  <span className="mono text-[10px] text-bone-dim/60">
                    0{i + 1}
                  </span>
                </div>
                <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-bone-dim">
                  {outcome.desc}
                </p>
                <div className={`mt-6 border-t ${outcome.rule} pt-3`}>
                  <span className="mono text-[10.5px] text-bone-dim/80">
                    {outcome.example}
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-6 flex flex-col gap-2 border border-dashed border-rule-film px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-4">
              <span className="eyebrow text-warn-bright">Next</span>
              <span className="font-display text-[1.35rem] text-bone">
                Recall alert
              </span>
            </div>
            <p className="max-w-md text-[12px] leading-relaxed text-bone-dim">
              Registered, but named in a NAFDAC recall or safety alert. The
              feed is not connected yet — this state is a promise, not a feature.
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
