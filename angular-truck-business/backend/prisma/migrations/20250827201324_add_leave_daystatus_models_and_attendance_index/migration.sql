/*
  Warnings:

  - You are about to drop the column `date` on the `Income` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `Income` table. All the data in the column will be lost.
  - Added the required column `income_date` to the `Income` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Attendance` MODIFY `check_out` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `Income` DROP COLUMN `date`,
    DROP COLUMN `note`,
    ADD COLUMN `contract_image_path` VARCHAR(255) NULL,
    ADD COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `income_date` DATE NOT NULL,
    MODIFY `description` TEXT NOT NULL;

-- CreateTable
CREATE TABLE `Staff` (
    `staff_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'staff',
    `profile_image_path` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `Staff_username_key`(`username`),
    PRIMARY KEY (`staff_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeDayStatus` (
    `employee_id` VARCHAR(191) NOT NULL,
    `work_date` DATE NOT NULL,
    `status` ENUM('NOT_CHECKED_IN', 'WORKING', 'OFF_DUTY', 'ON_LEAVE') NOT NULL,
    `source` ENUM('SYSTEM', 'ATTENDANCE', 'LEAVE', 'MANUAL') NOT NULL DEFAULT 'SYSTEM',
    `set_by` INTEGER NULL,
    `note` VARCHAR(255) NULL,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `EmployeeDayStatus_status_idx`(`status`),
    PRIMARY KEY (`employee_id`, `work_date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveRequest` (
    `leave_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` VARCHAR(191) NOT NULL,
    `leave_date` DATE NOT NULL,
    `leave_type` VARCHAR(20) NOT NULL,
    `reason` TEXT NULL,
    `approved_by` INTEGER NOT NULL,
    `approved_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `LeaveRequest_employee_id_leave_date_idx`(`employee_id`, `leave_date`),
    UNIQUE INDEX `LeaveRequest_employee_id_leave_date_key`(`employee_id`, `leave_date`),
    PRIMARY KEY (`leave_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_att_employee_date` ON `Attendance`(`employee_id`, `check_in`);

-- AddForeignKey
ALTER TABLE `EmployeeDayStatus` ADD CONSTRAINT `EmployeeDayStatus_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeDayStatus` ADD CONSTRAINT `EmployeeDayStatus_set_by_fkey` FOREIGN KEY (`set_by`) REFERENCES `Staff`(`staff_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `Staff`(`staff_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
