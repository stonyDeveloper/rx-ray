import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  // Well-known Nigerian OTC brands, Active status, likely to have a findable
  // product photo online with the reg. no. legible on the pack.
  const candidates = await prisma.greenbookProduct.findMany({
    where: {
      status: "Active",
      OR: [
        { applicantName: { contains: "Emzor" } },
        { applicantName: { contains: "Fidson" } },
        { applicantName: { contains: "GlaxoSmithKline" } },
        { applicantName: { contains: "May" } },
        { productName: { contains: "Panadol" } },
        { productName: { contains: "Coartem" } },
        { productName: { contains: "Emzor Paracetamol" } },
      ],
    },
    take: 20,
  });

  console.log(
    JSON.stringify(
      candidates.map((c) => ({
        name: c.productName,
        reg: c.regNo,
        applicant: c.applicantName,
        form: c.formName,
        status: c.status,
      })),
      null,
      2
    )
  );

  await prisma.$disconnect();
}

main();
