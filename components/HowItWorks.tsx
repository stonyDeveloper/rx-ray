import Container from "./Container";
import Reveal from "./Reveal";

const STEPS = [
  {
    n: "01",
    title: "Photograph the pack",
    tag: "Photo",
    copy: "Fill the frame with the NAFDAC number. It is the only field that can confirm a product; everything else is supporting evidence.",
  },
  {
    n: "02",
    title: "The model reads the label",
    tag: "Vision",
    copy: "Five fields are extracted — product, registration, batch, expiry, manufacturer — each marked clear, uncertain or not visible. The prompt forbids guessing.",
  },
  {
    n: "03",
    title: "We match the register",
    tag: "Register",
    copy: "An exact registration number is checked first, across every NAFDAC category. Product names are a fallback, never proof.",
  },
  {
    n: "04",
    title: "You get an honest outcome",
    tag: "Verdict",
    copy: "Registered, partial, not in the register, or needs a better photo. No 'fake' badge. No 'genuine' badge.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-t border-rule py-24 md:py-32">
      <Container className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-clinical">How it works</p>
          <h2 className="display mt-4 text-[clamp(2.4rem,4.2vw,3.9rem)]">
            Four steps,
            <br />
            <em>one rule:</em>
            <br />
            never guess.
          </h2>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-soft">
            Every field carries its own confidence, and anything unreadable is
            reported as unreadable — not filled in.
          </p>
        </div>

        <ol>
          {STEPS.map((step) => (
            <Reveal key={step.n}>
              <li className="grid grid-cols-[2.6rem_1fr] gap-5 border-t border-rule py-7 md:grid-cols-[5rem_1fr] md:gap-8 md:py-8">
                <span className="display text-[2rem] leading-none text-clinical/35">
                  {step.n}
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h3 className="text-[1.05rem] font-medium tracking-tight">
                      {step.title}
                    </h3>
                    <span className="eyebrow text-muted">{step.tag}</span>
                  </div>
                  <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-soft">
                    {step.copy}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
