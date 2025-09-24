-- AlterTable
ALTER TABLE `EmployeeDayStatus` ADD COLUMN `source` ENUM('SYSTEM', 'ATTENDANCE', 'LEAVE', 'MANUAL') NOT NULL DEFAULT 'SYSTEM',
    MODIFY `status` ENUM('NOT_CHECKED_IN', 'WORKING', 'OFF_DUTY', 'ON_LEAVE', 'ABSENT') NOT NULL;

-- CreateIndex
CREATE INDEX `EmployeeDayStatus_source_idx` ON `EmployeeDayStatus`(`source`);
