/*
  Warnings:

  - You are about to drop the column `poNumber` on the `Purchase` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invoiceNo]` on the table `Purchase` will be added. If there are existing duplicate values, this will fail.
  - Made the column `invoiceNo` on table `Purchase` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `Purchase_poNumber_key` ON `Purchase`;

-- AlterTable
ALTER TABLE `Product` MODIFY `stock` INTEGER NOT NULL DEFAULT 1,
    MODIFY `minStock` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Purchase` DROP COLUMN `poNumber`,
    MODIFY `invoiceNo` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Sale` ADD COLUMN `inventoryManaged` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `StockInRecord` ADD COLUMN `supplierContactName` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Purchase_invoiceNo_key` ON `Purchase`(`invoiceNo`);
