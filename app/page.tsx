import { prisma } from "@/lib/prisma";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import RegisterStrip, { type StripItem } from "@/components/RegisterStrip";
import HonestMatrix from "@/components/HonestMatrix";
import HowItWorks from "@/components/HowItWorks";
import VerdictStates from "@/components/VerdictStates";
import Provenance from "@/components/Provenance";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

// Recognisable, currently-Active entries make the register strip read as a
// real sample rather than noise. These are matched against the live snapshot;
// if a brand goes Inactive it simply drops out.
const SAMPLE_BRANDS = [
  "Augmentin",
  "Keppra",
  "Seretide",
  "Avamys",
  "Em-Vit",
  "Lokmal",
  "Maldox",
  "Emzolyn",
  "Emgyl",
  "Emcillin",
];

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function cleanName(raw: string) {
  return raw
    .replace(/\((?:check description|strength format|duplicate[^)]*)\)/gi, "")
    .replace(/[#*_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadRegister() {
  try {
    const [total, active, groups, latest, brandRows, fallbackRows] =
      await Promise.all([
        prisma.greenbookProduct.count(),
        prisma.greenbookProduct.count({ where: { status: "Active" } }),
        prisma.greenbookProduct.groupBy({ by: ["categoryName"], _count: true }),
        prisma.greenbookProduct.findMany({
          select: { syncedAt: true },
          orderBy: { syncedAt: "desc" },
          take: 1,
        }),
        prisma.greenbookProduct.findMany({
          where: {
            status: "Active",
            OR: SAMPLE_BRANDS.map((brand) => ({
              productName: { contains: brand },
            })),
          },
          select: { productName: true, regNo: true },
          take: 60,
        }),
        prisma.greenbookProduct.findMany({
          where: { status: "Active", regNo: { not: "" } },
          select: { productName: true, regNo: true },
          orderBy: { productId: "asc" },
          take: 24,
        }),
      ]);

    const seen = new Set<string>();
    const pool: StripItem[] = [];
    // Prefer the curated brands; only widen to arbitrary rows if the snapshot
    // happens to have very few of them.
    const source = brandRows.length >= 6 ? brandRows : [...brandRows, ...fallbackRows];
    for (const row of source) {
      const reg = row.regNo.trim();
      if (!reg || seen.has(reg)) continue;
      const name = cleanName(row.productName);
      if (!name || name.length > 38) continue;
      seen.add(reg);
      pool.push({ name, reg });
    }

    // Short names read best in a marquee; length is only a layout preference,
    // the data itself is untouched.
    const items = pool
      .sort((a, b) => a.name.length - b.name.length)
      .slice(0, 16);

    const categories = groups.filter((group) => {
      const name = group.categoryName.trim();
      return name.length > 0 && name.toUpperCase() !== "N/A";
    }).length;

    return {
      stats: {
        total,
        active,
        categories,
        synced: latest[0]?.syncedAt ? dateFormat.format(latest[0].syncedAt) : "—",
      },
      items,
    };
  } catch (error) {
    console.error("[home] Could not read the register:", error);
    return {
      stats: { total: 0, active: 0, categories: 0, synced: "—" },
      items: [] as StripItem[],
    };
  }
}

export default async function Home() {
  const { stats, items } = await loadRegister();

  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero
          stats={{ total: stats.total, active: stats.active, synced: stats.synced }}
        />
        <RegisterStrip items={items} />
        <HonestMatrix />
        <HowItWorks />
        <VerdictStates />
        <Provenance stats={stats} />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
