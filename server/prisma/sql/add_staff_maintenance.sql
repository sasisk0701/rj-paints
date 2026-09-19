CREATE TABLE IF NOT EXISTS `Staff` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NULL,
  `designation` VARCHAR(191) NULL,
  `business` ENUM('PAINTS', 'INTERIORS', 'BOTH') NOT NULL DEFAULT 'PAINTS',
  `dailyRate` DOUBLE NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `Staff_business_status_idx` (`business`, `status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `StaffWorkLog` (
  `id` VARCHAR(191) NOT NULL,
  `staffId` VARCHAR(191) NOT NULL,
  `workDate` DATE NOT NULL,
  `hoursWorked` DOUBLE NOT NULL DEFAULT 0,
  `workType` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `StaffWorkLog_staffId_workDate_key` (`staffId`, `workDate`),
  INDEX `StaffWorkLog_workDate_idx` (`workDate`),
  CONSTRAINT `StaffWorkLog_staffId_fkey`
    FOREIGN KEY (`staffId`) REFERENCES `Staff` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
