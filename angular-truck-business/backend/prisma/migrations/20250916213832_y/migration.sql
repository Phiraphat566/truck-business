/*
  Warnings:

  - You are about to drop the column `invoiceId` on the `Income` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Income` DROP FOREIGN KEY `Income_invoiceId_fkey`;

-- DropIndex
DROP INDEX `Income_invoiceId_key` ON `Income`;

-- AlterTable
ALTER TABLE `Income` DROP COLUMN `invoiceId`,
    ADD COLUMN `invoice_id` INTEGER NULL,
    MODIFY `description` TEXT NULL,
    MODIFY `category` VARCHAR(100) NULL;

-- CreateIndex
CREATE INDEX `idx_income_invoice_id` ON `Income`(`invoice_id`);

-- AddForeignKey
ALTER TABLE `Income` ADD CONSTRAINT `Income_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
