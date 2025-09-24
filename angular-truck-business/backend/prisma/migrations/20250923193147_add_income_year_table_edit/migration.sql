/*
  Warnings:

  - You are about to alter the column `category` on the `Income` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `amount` on the `Income` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(12,2)`.
  - You are about to alter the column `created_at` on the `Income` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.

*/
-- AlterTable
ALTER TABLE `Income` MODIFY `category` VARCHAR(100) NULL,
    MODIFY `amount` DECIMAL(12, 2) NOT NULL,
    MODIFY `contract_image_path` VARCHAR(255) NULL,
    MODIFY `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- CreateTable
CREATE TABLE `IncomeYear` (
    `year` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`year`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_income_date` ON `Income`(`income_date`);

-- CreateIndex
CREATE INDEX `idx_income_category` ON `Income`(`category`);

-- CreateIndex
CREATE INDEX `idx_income_created_at` ON `Income`(`created_at`);
