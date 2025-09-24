/*
  Warnings:

  - You are about to drop the column `created_at` on the `Income` table. All the data in the column will be lost.
  - You are about to drop the column `income_date` on the `Income` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `PaymentRecord` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(12,2)`.
  - You are about to alter the column `category` on the `PaymentRecord` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `created_at` on the `PaymentRecord` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - A unique constraint covering the columns `[receiptNo]` on the table `Income` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contractDate` to the `Income` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiptNo` to the `Income` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `idx_income_category` ON `Income`;

-- DropIndex
DROP INDEX `idx_income_created_at` ON `Income`;

-- DropIndex
DROP INDEX `idx_income_date` ON `Income`;

-- AlterTable
ALTER TABLE `Income` DROP COLUMN `created_at`,
    DROP COLUMN `income_date`,
    ADD COLUMN `contractDate` DATETIME(3) NOT NULL,
    ADD COLUMN `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `customerName` VARCHAR(191) NULL,
    ADD COLUMN `dueDate` DATETIME(3) NULL,
    ADD COLUMN `receiptNo` VARCHAR(191) NOT NULL,
    ADD COLUMN `receivedAt` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM('PENDING', 'OVERDUE', 'PAID', 'PARTIAL') NOT NULL DEFAULT 'PENDING',
    MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `PaymentRecord` ADD COLUMN `income_id` INTEGER NULL,
    MODIFY `amount` DECIMAL(12, 2) NOT NULL,
    MODIFY `category` VARCHAR(50) NULL,
    MODIFY `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `invoice_id` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Income_receiptNo_key` ON `Income`(`receiptNo`);

-- CreateIndex
CREATE INDEX `idx_income_contractDate` ON `Income`(`contractDate`);

-- CreateIndex
CREATE INDEX `idx_income_dueDate` ON `Income`(`dueDate`);

-- CreateIndex
CREATE INDEX `idx_income_status` ON `Income`(`status`);

-- CreateIndex
CREATE INDEX `idx_income_createdAt` ON `Income`(`createdAt`);

-- CreateIndex
CREATE INDEX `idx_payment_income` ON `PaymentRecord`(`income_id`);

-- AddForeignKey
ALTER TABLE `PaymentRecord` ADD CONSTRAINT `PaymentRecord_income_id_fkey` FOREIGN KEY (`income_id`) REFERENCES `Income`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `PaymentRecord` RENAME INDEX `PaymentRecord_invoice_id_fkey` TO `idx_payment_invoice`;
