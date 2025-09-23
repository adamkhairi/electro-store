/*
  Warnings:

  - A unique constraint covering the columns `[barcode]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "barcode" TEXT;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "afterQuantity" INTEGER,
ADD COLUMN     "beforeQuantity" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_barcode_idx" ON "products"("barcode");
