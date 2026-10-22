import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Container from "./Container";
import Reveal from "./Reveal";

export default function FinalCta() {
  return (
    <section className="border-t border-rule py-24 md:py-36">
      <Container className="flex flex-col items-center text-center">
        <Reveal>
          <p className="eyebrow text-clinical">Ready when you are</p>
          <h2 className="display mt-5 text-[clamp(3rem,7vw,6.2rem)]">
            Got a pack
            <br />
            in <em>hand?</em>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-soft">
            One clear photo of the NAFDAC number. Five fields. One answer that
            doesn&apos;t overclaim.
          </p>
          <Link
            href="/scan"
            className="group mt-9 inline-flex items-center gap-3 rounded-full bg-ink px-8 py-4 text-sm font-medium text-paper transition-colors hover:bg-clinical"
          >
            Scan a pack
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.8}
            />
          </Link>
          <p className="mt-6 mono text-[10px] uppercase tracking-[0.16em] text-muted">
            No account needed
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
