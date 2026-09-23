-- Add HSN to categories and move color to products.
ALTER TABLE `Category` ADD COLUMN `hsn` VARCHAR(191) NOT NULL DEFAULT '';

ALTER TABLE `Product` ADD COLUMN `color` VARCHAR(191) NOT NULL DEFAULT '';

ALTER TABLE `Product` DROP INDEX `Product_sku_key`;
ALTER TABLE `Product` DROP INDEX `Product_barcode_key`;

ALTER TABLE `Product` MODIFY COLUMN `sku` VARCHAR(191) NULL;
ALTER TABLE `Product` MODIFY COLUMN `barcode` VARCHAR(191) NULL;
