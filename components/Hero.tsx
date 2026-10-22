"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Container from "./Container";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type HeroStats = {
  total: number;
  active: number;
  synced: string;
};

const FIELDS = [
  { label: "PRODUCT", value: "Augmentin 625 mg" },
  { label: "REG. NO.", value: "04-1928" },
  { label: "BATCH", value: "Not visible", muted: true },
  { label: "EXPIRY", value: "Not visible", muted: true },
];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export default function Hero({ stats }: { stats: HeroStats }) {
  const sectionRef = useRef<HTMLElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const verdictRef = useRef<HTMLDivElement>(null);
  const valueRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const plate = plateRef.current;
    if (!plate) return;

    const values = valueRefs.current.filter(Boolean) as HTMLSpanElement[];
    const verdict = verdictRef.current;

    const apply = (progress: number) => {
      const scan = clamp01(progress / 0.82);
      plate.style.setProperty("--scan", `${(scan * 100).toFixed(2)}%`);

      if (beamRef.current) {
        beamRef.current.style.opacity =
          scan <= 0.005 || scan >= 0.995 ? "0" : "1";
      }

      values.forEach((el, i) => {
        const start = 0.14 + i * 0.11;
        const v = clamp01((progress - start) / 0.08);
        el.style.opacity = String(0.16 + 0.84 * v);
        el.style.transform = `translateY(${((1 - v) * 5).toFixed(2)}px)`;
      });

      if (verdict) {
        const v = clamp01((progress - 0.68) / 0.14);
        verdict.style.opacity = String(v);
        verdict.style.transform = `translateY(${((1 - v) * 12).toFixed(2)}px)`;
      }
    };

    if (reducedMotion) {
      apply(1);
      plate.style.setProperty("--scan", "56%");
      if (beamRef.current) beamRef.current.style.opacity = "0.85";
      values.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      if (verdict) {
        verdict.style.opacity = "1";
        verdict.style.transform = "none";
      }
      return;
    }

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      apply(0);
      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current!,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => apply(gsap.utils.clamp(0, 1, self.progress)),
        invalidateOnRefresh: true,
      });
      return () => trigger.kill();
    });

    mm.add("(max-width: 1023px)", () => {
      apply(0);
      let played = false;
      const proxy = { p: 0 };
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting || played) continue;
            played = true;
            gsap.to(proxy, {
              p: 1,
              duration: 2.2,
              ease: "power2.inOut",
              onUpdate: () => apply(proxy.p),
              onComplete: () => observer.disconnect(),
            });
          }
        },
        { threshold: 0.35 }
      );
      if (plateRef.current) observer.observe(plateRef.current);
      return () => observer.disconnect();
    });

    return () => mm.revert();
  }, [reducedMotion]);

  return (
    <section id="top" ref={sectionRef} className="relative lg:h-[180vh]">
      <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center">
        <Container className="grid items-center gap-12 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:py-0">
          {/* ---------------- copy ---------------- */}
          <div>
            <p
              className="eyebrow fade-up flex items-center gap-2.5 text-clinical"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-clinical" />
              NAFDAC Greenbook · Nigeria
            </p>

            <h1 className="display mt-6 text-[clamp(3.1rem,7.4vw,6.4rem)]">
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="rise block" style={{ animationDelay: "0.08s" }}>
                  See <em className="text-clinical">through</em>
                </span>
              </span>
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="rise block" style={{ animationDelay: "0.16s" }}>
                  every pack.
                </span>
              </span>
            </h1>

            <p
              className="fade-up mt-7 max-w-[30rem] text-[15px] leading-relaxed text-ink-soft"
              style={{ animationDelay: "0.34s" }}
            >
              Photograph a medicine pack. Rx-Ray reads what&apos;s printed on
              it, checks that against NAFDAC&apos;s official register, and
              tells you exactly what it could verify — and what it couldn&apos;t.
            </p>

            <div
              className="fade-up mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "0.44s" }}
            >
              <Link
                href="/scan"
                className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-[13.5px] font-medium text-paper transition-colors hover:bg-clinical"
              >
                Scan a pack
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={1.8}
                />
              </Link>
              <Link
                href="/#how"
                className="group inline-flex items-center gap-2 rounded-full border border-rule-strong px-6 py-3.5 text-[13.5px] font-medium text-ink transition-colors hover:border-ink"
              >
                How it works
                <ArrowDown
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
                  strokeWidth={1.8}
                />
              </Link>
            </div>

            <dl
              className="fade-up mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-rule pt-5"
              style={{ animationDelay: "0.55s" }}
            >
              <Meta value={stats.total.toLocaleString("en-NG")} label="registrations" />
              <Meta value={stats.active.toLocaleString("en-NG")} label="active" />
              <Meta value={stats.synced} label="last sync" mono />
            </dl>
          </div>

          {/* ---------------- the scan ---------------- */}
          <div className="mx-auto w-full max-w-[470px]">
            <div
              className="fade-up film-noise relative border border-rule-film bg-film text-bone shadow-[0_40px_90px_-45px_rgba(20,21,15,0.75)]"
              style={{ animationDelay: "0.22s" }}
            >
              <div className="flex items-center justify-between border-b border-rule-film px-4 py-3">
                <span className="eyebrow text-bone-dim">Specimen 001</span>
                <span className="eyebrow flex items-center gap-2 text-bone-dim">
                  <span className="h-1.5 w-1.5 rounded-full bg-clinical-bright animate-blink" />
                  Live read
                </span>
              </div>

              <div
                ref={plateRef}
                data-scan-plate
                className="relative h-[clamp(260px,43vh,420px)] overflow-hidden bg-film-2"
                style={{ "--scan": "0%" } as CSSProperties}
              >
                <Image
                  src="/images/pills-1.jpg"
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 470px, 92vw"
                  className="object-cover [filter:saturate(0.5)_contrast(1.02)_brightness(0.95)]"
                />

                {/* the part the machine has already read */}
                <div
                  className="absolute inset-0"
                  style={{ clipPath: "inset(0 0 calc(100% - var(--scan)) 0)" }}
                >
                  <Image
                    src="/images/pills-1.jpg"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 470px, 92vw"
                    className="object-cover [filter:grayscale(1)_contrast(1.4)_brightness(0.72)]"
                  />
                  <div className="absolute inset-0 bg-[#06130d]/30 mix-blend-multiply" />
                  <div className="tick-grid absolute inset-0 opacity-60" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,10,8,0.6)_100%)]" />
                </div>

                {/* beam */}
                <div
                  ref={beamRef}
                  className="absolute inset-x-0 z-10"
                  style={{ top: "var(--scan)", transform: "translateY(-50%)" }}
                >
                  <div className="h-px w-full bg-clinical-bright shadow-[0_0_18px_2px_rgba(78,211,163,0.55)]" />
                  <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-clinical-bright/15 to-transparent" />
                  <div className="absolute right-3 top-2 mono text-[9px] tracking-[0.2em] text-clinical-bright">
                    SCAN
                  </div>
                </div>

                {/* frame marks */}
                <span className="corner corner-tl z-10 text-bone/40" />
                <span className="corner corner-tr z-10 text-bone/40" />
                <span className="corner corner-bl z-10 text-bone/40" />
                <span className="corner corner-br z-10 text-bone/40" />

                <div className="absolute bottom-3 left-4 mono text-[9px] tracking-[0.18em] text-bone/45">
                  NAFDAC / GREENBOOK
                </div>

                {/* verdict locks in over the specimen */}
                <div
                  ref={verdictRef}
                  className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-film via-film/92 to-transparent px-4 pb-4 pt-16"
                >
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="eyebrow text-bone-dim">Verdict</div>
                      <div className="mt-1 font-display text-[1.55rem] leading-none text-clinical-bright">
                        Registered &amp; active
                      </div>
                      <p className="mt-1.5 mono text-[9.5px] tracking-[0.06em] text-bone-dim">
                        2 of 4 fields legible · matched on 04-1928
                      </p>
                    </div>
                    <div className="shrink-0 -rotate-3 border border-clinical-bright/45 px-2.5 py-1.5 text-center">
                      <div className="eyebrow text-clinical-bright/80">Greenbook</div>
                      <div className="mono mt-0.5 text-[10px] text-clinical-bright">
                        04-1928
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-rule-film">
                {FIELDS.map((field, i) => (
                  <div
                    key={field.label}
                    className="flex items-baseline justify-between gap-4 border-b border-rule-film px-4 py-2.5 last:border-b-0"
                  >
                    <span className="eyebrow text-bone-dim">{field.label}</span>
                    <span
                      ref={(el) => {
                        valueRefs.current[i] = el;
                      }}
                      className={`mono text-[12px] ${
                        field.muted ? "text-bone-dim italic" : "text-bone"
                      }`}
                    >
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 hidden text-center mono text-[9.5px] uppercase tracking-[0.16em] text-muted lg:block">
              Scroll to read the pack
            </p>
          </div>
        </Container>
      </div>
    </section>
  );
}

function Meta({
  value,
  label,
  mono = false,
}: {
  value: string;
  label: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className={`text-[1.05rem] leading-none ${mono ? "mono text-[0.82rem]" : "font-display"}`}>
        {value}
      </dt>
      <dd className="mt-1.5 eyebrow text-muted">{label}</dd>
    </div>
  );
}
