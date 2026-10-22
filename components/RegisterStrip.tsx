import Link from "next/link";

export type StripItem = { name: string; reg: string };

export default function RegisterStrip({ items }: { items: StripItem[] }) {
  if (items.length === 0) return null;

  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((item) => (
        <div key={`${item.reg}-${item.name}`} className="flex items-center gap-3 px-5">
          <span className="mono text-[11px] text-ink">{item.name}</span>
          <span className="mono text-[10px] text-muted">{item.reg}</span>
          <span className="h-1 w-1 rounded-full bg-clinical/50" />
        </div>
      ))}
    </div>
  );

  return (
    <section
      aria-label="A sample of products in the register"
      className="border-y border-rule bg-paper-2"
    >
      <div className="flex items-stretch">
        <div className="hidden shrink-0 items-center border-r border-rule px-6 md:flex">
          <Link href="/#data" className="eyebrow text-muted hover:text-ink">
            In the register
          </Link>
        </div>
        <div className="marquee-host relative flex-1 overflow-hidden py-3.5">
          <div className="flex w-max animate-marquee">
            {row}
            <div aria-hidden="true">{row}</div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-paper-2 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-paper-2 to-transparent" />
        </div>
      </div>
    </section>
  );
}
