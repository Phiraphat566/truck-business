/*
  Warnings:

  - You are about to drop the `MonthlySummary` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `MonthlySummary` DROP FOREIGN KEY `MonthlySummary_ibfk_1`;

-- DropTable
DROP TABLE `MonthlySummary`;

-- CreateTable
CREATE TABLE `EmployeeMonthlySummary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `planned_days` INTEGER NOT NULL DEFAULT 0,
    `present_days` INTEGER NOT NULL DEFAULT 0,
    `late_days` INTEGER NOT NULL DEFAULT 0,
    `absent_days` INTEGER NOT NULL DEFAULT 0,
    `leave_days` INTEGER NOT NULL DEFAULT 0,
    `work_hours` DECIMAL(10, 2) NULL,
    `ot_hours` DECIMAL(10, 2) NULL,
    `on_time_rate` DECIMAL(5, 2) NULL,

    INDEX `idx_empms_year_month`(`year`, `month`),
    UNIQUE INDEX `uq_employee_month`(`employee_id`, `year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceMonthlySummary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `income_received` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `expense_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `net_profit` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `invoice_paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `invoice_pending_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `invoice_overdue_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `invoice_count` INTEGER NOT NULL DEFAULT 0,
    `paid_count` INTEGER NOT NULL DEFAULT 0,
    `pending_count` INTEGER NOT NULL DEFAULT 0,
    `overdue_count` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_finance_month`(`year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EmployeeMonthlySummary` ADD CONSTRAINT `EmployeeMonthlySummary_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE;
