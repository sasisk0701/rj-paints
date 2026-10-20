UPDATE `Purchase`
SET `invoiceNo` = CONCAT('LEGACY-', `id`)
WHERE `invoiceNo` IS NULL OR `invoiceNo` = '';

ALTER TABLE `Purchase` ADD COLUMN `poNumber` VARCHAR(191) NULL;

UPDATE `Purchase` AS purchase
JOIN (
  SELECT `id`, ROW_NUMBER() OVER (ORDER BY `createdAt`, `id`) AS `rowNumber`
  FROM `Purchase`
) AS numbered ON numbered.`id` = purchase.`id`
SET purchase.`poNumber` = CONCAT('PO-', LPAD(numbered.`rowNumber`, 8, '0'));

ALTER TABLE `Purchase` MODIFY `poNumber` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `Purchase_poNumber_key` ON `Purchase`(`poNumber`);
