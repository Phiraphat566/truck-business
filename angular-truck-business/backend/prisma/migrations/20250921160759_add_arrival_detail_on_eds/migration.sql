-- AlterTable
ALTER TABLE `EmployeeDayStatus` ADD COLUMN `arrival_detail` ENUM('ON_TIME', 'LATE') NULL;

-- CreateIndex
CREATE INDEX `EmployeeDayStatus_arrival_detail_idx` ON `EmployeeDayStatus`(`arrival_detail`);
