/*
  Warnings:

  - You are about to alter the column `amount` on the `Income` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(12,2)`.
  - A unique constraint covering the columns `[invoiceId]` on the table `Income` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Income` ADD COLUMN `invoiceId` INTEGER NULL,
    MODIFY `amount` DECIMAL(12, 2) NOT NULL;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceNo` VARCHAR(50) NOT NULL,
    `customerName` VARCHAR(255) NOT NULL,
    `contractDate` DATE NOT NULL,
    `dueDate` DATE NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('PENDING', 'OVERDUE', 'PAID') NOT NULL DEFAULT 'PENDING',
    `paidAt` DATE NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `Invoice_invoiceNo_key`(`invoiceNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Income_invoiceId_key` ON `Income`(`invoiceId`);

-- AddForeignKey
ALTER TABLE `Income` ADD CONSTRAINT `Income_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
