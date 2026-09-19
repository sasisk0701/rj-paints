/*
  Warnings:

  - You are about to drop the `labourpayment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[accountNumber]` on the table `BankAccount` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `supplierName` to the `StockInRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `stockinrecord` DROP FOREIGN KEY `StockInRecord_supplierId_fkey`;

-- AlterTable
ALTER TABLE `bankaccount` ADD COLUMN `business` ENUM('PAINTS', 'INTERIORS', 'BOTH') NOT NULL DEFAULT 'PAINTS',
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    MODIFY `currentBalance` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `type` VARCHAR(191) NOT NULL DEFAULT 'Current';

-- AlterTable
ALTER TABLE `expense` ADD COLUMN `business` ENUM('PAINTS', 'INTERIORS', 'BOTH') NOT NULL DEFAULT 'PAINTS';

-- AlterTable
ALTER TABLE `stockinrecord` ADD COLUMN `supplierName` VARCHAR(191) NOT NULL,
    MODIFY `supplierId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `supplier` ADD COLUMN `business` ENUM('PAINTS', 'INTERIORS', 'BOTH') NOT NULL DEFAULT 'PAINTS',
    ADD COLUMN `notes` TEXT NULL;

-- DropTable
DROP TABLE `labourpayment`;

-- CreateTable
CREATE TABLE `StockAdjustmentRecord` (
    `id` VARCHAR(191) NOT NULL,
    `referenceNo` VARCHAR(191) NOT NULL,
    `adjustmentDate` DATETIME(3) NOT NULL,
    `business` ENUM('PAINTS', 'INTERIORS', 'BOTH') NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StockAdjustmentRecord_referenceNo_key`(`referenceNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockAdjustmentItem` (
    `id` VARCHAR(191) NOT NULL,
    `stockAdjustmentId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `systemStock` INTEGER NOT NULL,
    `physicalCount` INTEGER NOT NULL,
    `difference` INTEGER NOT NULL,
    `notes` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Purchase` (
    `id` VARCHAR(191) NOT NULL,
    `poNumber` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NULL,
    `supplierName` VARCHAR(191) NOT NULL,
    `purchaseDate` DATETIME(3) NOT NULL,
    `paymentMode` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `subtotal` DOUBLE NOT NULL DEFAULT 0,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `business` ENUM('PAINTS', 'INTERIORS', 'BOTH') NOT NULL DEFAULT 'PAINTS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Purchase_poNumber_key`(`poNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseItem` (
    `id` VARCHAR(191) NOT NULL,
    `purchaseId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productName` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `purchasePrice` DOUBLE NOT NULL,
    `gstRate` DOUBLE NOT NULL DEFAULT 18,
    `amount` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sale` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `saleDate` DATETIME(3) NOT NULL,
    `paymentMode` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Paid',
    `subtotal` DOUBLE NOT NULL DEFAULT 0,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `business` ENUM('PAINTS', 'INTERIORS', 'BOTH') NOT NULL DEFAULT 'PAINTS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Sale_invoiceNumber_key`(`invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaleItem` (
    `id` VARCHAR(191) NOT NULL,
    `saleId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productName` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `sellingPrice` DOUBLE NOT NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `gstRate` DOUBLE NOT NULL DEFAULT 18,
    `amount` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Quotation` (
    `id` VARCHAR(191) NOT NULL,
    `quoteNumber` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NULL,
    `validUntil` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Draft',
    `subtotal` DOUBLE NOT NULL DEFAULT 0,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `terms` TEXT NULL,
    `business` ENUM('PAINTS', 'INTERIORS', 'BOTH') NOT NULL DEFAULT 'PAINTS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Quotation_quoteNumber_key`(`quoteNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuotationItem` (
    `id` VARCHAR(191) NOT NULL,
    `quotationId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DOUBLE NOT NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `gstRate` DOUBLE NOT NULL DEFAULT 18,
    `amount` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `business` ENUM('PAINTS', 'INTERIORS', 'BOTH') NOT NULL DEFAULT 'PAINTS',
    `creditLimit` DOUBLE NOT NULL DEFAULT 0.0,
    `outstandingBalance` DOUBLE NOT NULL DEFAULT 0.0,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BankTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `bankAccountId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `direction` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CashTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `direction` VARCHAR(191) NOT NULL,
    `business` ENUM('PAINTS', 'INTERIORS', 'BOTH') NOT NULL DEFAULT 'PAINTS',
    `reference` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentRecord` (
    `id` VARCHAR(191) NOT NULL,
    `refNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `party` VARCHAR(191) NOT NULL,
    `paymentMode` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `notes` VARCHAR(191) NULL,
    `business` ENUM('PAINTS', 'INTERIORS', 'BOTH') NOT NULL DEFAULT 'PAINTS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PaymentRecord_refNumber_key`(`refNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Staff` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `designation` VARCHAR(191) NULL,
    `business` ENUM('PAINTS', 'INTERIORS', 'BOTH') NOT NULL DEFAULT 'PAINTS',
    `dailyRate` DOUBLE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffWorkLog` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `workDate` DATETIME(3) NOT NULL,
    `hoursWorked` DOUBLE NOT NULL,
    `workType` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `BankAccount_accountNumber_key` ON `BankAccount`(`accountNumber`);

-- AddForeignKey
ALTER TABLE `StockInRecord` ADD CONSTRAINT `StockInRecord_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAdjustmentItem` ADD CONSTRAINT `StockAdjustmentItem_stockAdjustmentId_fkey` FOREIGN KEY (`stockAdjustmentId`) REFERENCES `StockAdjustmentRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAdjustmentItem` ADD CONSTRAINT `StockAdjustmentItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseItem` ADD CONSTRAINT `PurchaseItem_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `Purchase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseItem` ADD CONSTRAINT `PurchaseItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sale` ADD CONSTRAINT `Sale_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleItem` ADD CONSTRAINT `SaleItem_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleItem` ADD CONSTRAINT `SaleItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuotationItem` ADD CONSTRAINT `QuotationItem_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `Quotation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BankTransaction` ADD CONSTRAINT `BankTransaction_bankAccountId_fkey` FOREIGN KEY (`bankAccountId`) REFERENCES `BankAccount`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffWorkLog` ADD CONSTRAINT `StaffWorkLog_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
