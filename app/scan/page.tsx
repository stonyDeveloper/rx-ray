import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Nav from "@/components/Nav";
import ScanTool from "@/components/ScanTool";

export const metadata: Metadata = {
  title: "Scan a pack — Rx-Ray",
  description:
    "Photograph a medicine pack — or type its NAFDAC registration number — and check it against the Greenbook. Registered, partial, not found, or needs a better photo.",
};

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

async function getSnapshotDate(): Promise<string | null> {
  try {
    const rows = await prisma.greenbookProduct.findMany({
      select: { syncedAt: true },
      orderBy: { syncedAt: "desc" },
      take: 1,
    });
    return rows[0]?.syncedAt ? dateFormat.format(rows[0].syncedAt) : null;
  } catch (error) {
    console.error("[scan] Could not read the snapshot date:", error);
    return null;
  }
}

export default async function ScanPage() {
  const dataAsOf = await getSnapshotDate();

  return (
    <>
      <Nav />
      <ScanTool dataAsOf={dataAsOf} />
    </>
  );
}
