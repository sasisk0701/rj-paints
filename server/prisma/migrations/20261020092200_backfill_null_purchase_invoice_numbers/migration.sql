UPDATE `Purchase`
SET `invoiceNo` = CONCAT('LEGACY-', `id`)
WHERE `invoiceNo` IS NULL OR `invoiceNo` = '';
