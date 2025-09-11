/*
  Warnings:

  - You are about to alter the column `liters` on the `FuelLog` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.
  - You are about to alter the column `cost` on the `FuelLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(12,2)`.
  - You are about to drop the column `fuel_cost` on the `Trip` table. All the data in the column will be lost.
  - You are about to alter the column `fuel_used_liters` on the `Trip` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[plate]` on the table `Truck` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `FuelLog` ADD COLUMN `price_per_liter` DECIMAL(10, 2) NULL,
    MODIFY `liters` DECIMAL(10, 2) NOT NULL,
    MODIFY `cost` DECIMAL(12, 2) NOT NULL;

-- AlterTable
ALTER TABLE `Trip` DROP COLUMN `fuel_cost`,
    MODIFY `fuel_used_liters` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `Truck` ADD COLUMN `fuel_efficiency_km_per_liter` DECIMAL(10, 2) NULL;

-- CreateIndex
CREATE INDEX `idx_fuellog_date` ON `FuelLog`(`fuel_date`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_truck_plate` ON `Truck`(`plate`);
