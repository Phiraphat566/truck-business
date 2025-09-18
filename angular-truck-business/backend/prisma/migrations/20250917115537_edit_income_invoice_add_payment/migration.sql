/*
  Warnings:

  - You are about to drop the column `invoice_id` on the `Income` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Income` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,2)`.
  - You are about to alter the column `contract_image_path` on the `Income` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to drop the column `description` on the `Invoice` table. All the data in the column will be lost.
  - You are about to alter the column `customerName` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `amount` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,2)`.

*/
-- DropForeignKey
ALTER TABLE `Income` DROP FOREIGN KEY `Income_invoice_id_fkey`;

-- DropIndex
DROP INDEX `idx_income_date` ON `Income`;

-- DropIndex
DROP INDEX `idx_invoice_contract_status` ON `Invoice`;

-- DropIndex
DROP INDEX `idx_invoice_due_status` ON `Invoice`;

-- AlterTable
ALTER TABLE `Income` DROP COLUMN `invoice_id`,
    MODIFY `description` VARCHAR(191) NULL,
    MODIFY `category` VARCHAR(191) NULL,
    MODIFY `amount` DECIMAL(10, 2) NOT NULL,
    MODIFY `contract_image_path` VARCHAR(191) NULL,
    MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `Invoice` DROP COLUMN `description`,
    MODIFY `invoiceNo` VARCHAR(191) NOT NULL,
    MODIFY `customerName` VARCHAR(191) NOT NULL,
    MODIFY `contractDate` DATETIME(3) NOT NULL,
    MODIFY `dueDate` DATETIME(3) NOT NULL,
    MODIFY `amount` DECIMAL(10, 2) NOT NULL,
    MODIFY `paidAt` DATETIME(3) NULL,
    MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `PaymentRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payment_date` DATE NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `attachment` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `invoice_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaymentRecord` ADD CONSTRAINT `PaymentRecord_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
