-- CreateTable
CREATE TABLE "GreenbookProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "regNo" TEXT NOT NULL,
    "normalizedRegNo" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "categoryName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "approvalDate" DATETIME,
    "expiryDate" DATETIME,
    "strength" TEXT,
    "formName" TEXT,
    "ingredientName" TEXT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RecallAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME,
    "type" TEXT,
    "productType" TEXT,
    "manufacturer" TEXT,
    "detailUrl" TEXT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "GreenbookProduct_productId_key" ON "GreenbookProduct"("productId");

-- CreateIndex
CREATE INDEX "GreenbookProduct_normalizedRegNo_idx" ON "GreenbookProduct"("normalizedRegNo");

-- CreateIndex
CREATE INDEX "GreenbookProduct_productName_idx" ON "GreenbookProduct"("productName");

-- CreateIndex
CREATE INDEX "RecallAlert_title_idx" ON "RecallAlert"("title");

-- CreateIndex
CREATE INDEX "RecallAlert_manufacturer_idx" ON "RecallAlert"("manufacturer");
