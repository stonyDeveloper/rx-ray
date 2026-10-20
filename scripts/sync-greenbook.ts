// Syncs NAFDAC's public Greenbook into the local SQLite database.
// Usage: node --env-file=.env.local --import tsx scripts/sync-greenbook.ts
//
// The Greenbook site (https://greenbook.nafdac.gov.ng/) serves its search
// table through an undocumented but public DataTables-style JSON endpoint at
// its root URL. No auth. There is no category filter here on purpose: the app
// checks medicine packs, but a registration number can belong to any NAFDAC
// category (drugs, food, cosmetics, devices), and an unfiltered search is what
// stops a legitimate cosmetic from being reported as "not in the register".
//
// The endpoint times out on very large `length` values (tested: 10000 fails,
// 2000 is reliable), so we page through it in chunks of 2000.

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const BASE_URL = "https://greenbook.nafdac.gov.ng/";
const PAGE_SIZE = 2000;

function buildUrl(start: number) {
  const params = new URLSearchParams();
  params.set("draw", "1");
  params.set("columns[0][data]", "product_name");
  params.set("columns[3][data]", "product_category_id");
  params.set("columns[5][data]", "NAFDAC");
  params.set("start", String(start));
  params.set("length", String(PAGE_SIZE));
  params.set("search[value]", "");
  return `${BASE_URL}?${params.toString()}`;
}

function normalizeRegNo(raw: string) {
  return (raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#039;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

function decodeEntities(raw: string | null | undefined) {
  if (!raw) return raw;
  return raw.replace(/&(amp|quot|#039|apos|lt|gt);/g, (m) => HTML_ENTITIES[m] ?? m);
}

function parseDate(value: unknown) {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

type GreenbookRow = {
  product_id: number;
  product_name?: string;
  NAFDAC?: string;
  product_category_id: number;
  status?: string;
  approval_date?: string;
  expiry_date?: string;
  strength?: string;
  applicant?: { name?: string };
  applicant_name?: string;
  product_category?: { name?: string };
  category_name?: string;
  form?: { name?: string };
  form_name?: string;
  ingredient?: { ingredient_name?: string };
  ingredient_name?: string;
};

async function fetchPage(start: number) {
  const res = await fetch(buildUrl(start), {
    headers: { "X-Requested-With": "XMLHttpRequest" },
  });
  if (!res.ok) {
    throw new Error(`Greenbook request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function main() {
  const runStartedAt = new Date();
  console.log("Fetching first page to get the total count...");
  const first = await fetchPage(0);
  const total: number = first.recordsFiltered ?? first.recordsTotal;
  console.log(`Greenbook: ${total} products across all categories.`);

  let rows: GreenbookRow[] = [...first.data];
  for (let start = PAGE_SIZE; start < total; start += PAGE_SIZE) {
    console.log(`Fetching ${start}-${Math.min(start + PAGE_SIZE, total)} of ${total}...`);
    const page = await fetchPage(start);
    rows = rows.concat(page.data);
  }

  console.log(`Fetched ${rows.length} rows. Upserting into the local database...`);

  const categories = new Map<number, string>();
  let count = 0;

  for (const row of rows) {
    const regNo = row.NAFDAC ?? "";
    const productName = decodeEntities(row.product_name ?? "") ?? "";
    const applicantName =
      decodeEntities(row.applicant?.name ?? row.applicant_name ?? "") ?? "";
    const ingredientName =
      decodeEntities(
        row.ingredient?.ingredient_name ?? row.ingredient_name ?? null
      ) ?? null;
    const categoryName =
      row.product_category?.name ?? row.category_name ?? "";
    categories.set(row.product_category_id, categoryName);

    await prisma.greenbookProduct.upsert({
      where: { productId: row.product_id },
      create: {
        productId: row.product_id,
        productName,
        regNo,
        normalizedRegNo: normalizeRegNo(regNo),
        applicantName,
        categoryId: row.product_category_id,
        categoryName,
        status: row.status ?? "",
        approvalDate: parseDate(row.approval_date),
        expiryDate: parseDate(row.expiry_date),
        strength: row.strength ?? null,
        formName: row.form?.name ?? row.form_name ?? null,
        ingredientName,
      },
      update: {
        productName,
        regNo,
        normalizedRegNo: normalizeRegNo(regNo),
        applicantName,
        categoryName,
        status: row.status ?? "",
        approvalDate: parseDate(row.approval_date),
        expiryDate: parseDate(row.expiry_date),
        strength: row.strength ?? null,
        formName: row.form?.name ?? row.form_name ?? null,
        ingredientName,
        syncedAt: runStartedAt,
      },
    });

    count++;
    if (count % 500 === 0) console.log(`  ...${count}/${rows.length}`);
  }

  // Anything the source no longer returns is a withdrawal or a merge upstream.
  // Leaving it in place would keep a withdrawn product matchable forever.
  const pruned = await prisma.greenbookProduct.deleteMany({
    where: { syncedAt: { lt: runStartedAt } },
  });

  console.log(
    `Done. ${count} products synced across ${categories.size} categories, ${pruned.count} stale rows pruned: ${
      [...categories.entries()].map(([id, name]) => `${name} (${id})`).join(", ")
    }`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
