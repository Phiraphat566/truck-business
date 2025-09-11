/*
  Warnings:

  - You are about to drop the column `note` on the `EmployeeDayStatus` table. All the data in the column will be lost.
  - You are about to drop the column `set_by` on the `EmployeeDayStatus` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `EmployeeDayStatus` DROP FOREIGN KEY `EmployeeDayStatus_set_by_fkey`;

-- AlterTable
ALTER TABLE `EmployeeDayStatus` DROP COLUMN `note`,
    DROP COLUMN `set_by`;
