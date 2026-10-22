import { ArrowUpRight } from "lucide-react";
import Container from "./Container";
import Reveal from "./Reveal";

export type ProvenanceStats = {
  total: number;
  active: number;
  categories: number;
  synced: string;
};

export default function Provenance({ stats }: { stats: ProvenanceStats }) {
  return (
    <section id="data" className="border-t border-rule py-24 md:py-32">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <Reveal>
          <p className="eyebrow text-clinical">Data</p>
          <h2 className="display mt-4 text-[clamp(2.4rem,4.4vw,3.9rem)]">
            Where this
            <br />
            comes <em>from.</em>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">
            One source of truth: NAFDAC&apos;s own public register. Nothing is
            scraped from unofficial lists, resold databases or guesswork.
          </p>

          <ul className="mt-8 border-t border-rule">
            <li className="border-b border-rule py-4">
              <a
                href="https://greenbook.nafdac.gov.ng/"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between gap-4"
              >
                <span className="text-[13.5px] font-medium">
                  NAFDAC Greenbook
                </span>
                <ArrowUpRight
                  className="h-4 w-4 text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  strokeWidth={1.7}
                />
              </a>
              <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-ink-soft">
                Every registered product, all categories. Pulled in full and
                upserted — the number on this page is read live from that copy.
              </p>
            </li>
            <li className="border-b border-rule py-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13.5px] font-medium">
                  Recalls &amp; Safety Alerts
                </span>
                <span className="eyebrow text-warn">Not connected</span>
              </div>
              <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-ink-soft">
                The next piece of work. Until it ships, no result claims a recall
                was checked.
              </p>
            </li>
            <li className="border-b border-rule py-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13.5px] font-medium">Batch traceability</span>
                <span className="eyebrow text-muted">Unavailable</span>
              </div>
              <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-ink-soft">
                Not in the public register. Any tool claiming batch-level
                verification from this data is overstating it.
              </p>
            </li>
          </ul>
        </Reveal>

        <Reveal delay={0.08}>
          <dl className="grid grid-cols-2 gap-px border border-rule bg-rule">
            <Stat value={stats.total.toLocaleString("en-NG")} label="registrations" />
            <Stat value={stats.active.toLocaleString("en-NG")} label="active" />
            <Stat value={String(stats.categories)} label="product categories" />
            <Stat value={stats.synced} label="last sync" small />
          </dl>
          <p className="mt-4 max-w-md text-[11.5px] leading-relaxed text-muted">
            A snapshot can lag the live register by days. Each scan is checked
            against the local copy as of the date above — not against a
            real-time feed.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

function Stat({
  value,
  label,
  small = false,
}: {
  value: string;
  label: string;
  small?: boolean;
}) {
  return (
    <div className="bg-paper p-6 md:p-8">
      <dt
        className={
          small
            ? "mono text-[1.15rem] leading-none text-ink"
            : "font-display text-[clamp(2.4rem,4vw,3.4rem)] leading-none text-ink"
        }
      >
        {value}
      </dt>
      <dd className="eyebrow mt-2.5 text-muted">{label}</dd>
    </div>
  );
}
