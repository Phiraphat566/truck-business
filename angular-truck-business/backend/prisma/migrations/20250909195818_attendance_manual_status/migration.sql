/*
  Warnings:

  - A unique constraint covering the columns `[employee_id,work_date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `status` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `work_date` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `idx_att_employee_date` ON `Attendance`;

-- AlterTable
ALTER TABLE `Attendance` ADD COLUMN `status` ENUM('ON_TIME', 'LATE') NOT NULL,
    ADD COLUMN `work_date` DATE NOT NULL;

-- CreateIndex
CREATE INDEX `Attendance_employee_id_work_date_idx` ON `Attendance`(`employee_id`, `work_date`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_att_once_per_day` ON `Attendance`(`employee_id`, `work_date`);
