/*
  Warnings:

  - You are about to drop the column `max_distance` on the `TravelCost` table. All the data in the column will be lost.
  - You are about to drop the column `min_distance` on the `TravelCost` table. All the data in the column will be lost.
  - You are about to drop the column `rate_baht` on the `TravelCost` table. All the data in the column will be lost.
  - Added the required column `effective_from` to the `TravelCost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `min_km` to the `TravelCost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_per_round` to the `TravelCost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trip_date` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `TravelCost` DROP COLUMN `max_distance`,
    DROP COLUMN `min_distance`,
    DROP COLUMN `rate_baht`,
    ADD COLUMN `effective_from` DATE NOT NULL,
    ADD COLUMN `effective_to` DATE NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `max_km` INTEGER NULL,
    ADD COLUMN `min_km` INTEGER NOT NULL,
    ADD COLUMN `note` VARCHAR(255) NULL,
    ADD COLUMN `price_per_round` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `Trip` ADD COLUMN `trip_date` DATE NOT NULL;

-- CreateIndex
CREATE INDEX `TravelCost_effective_from_effective_to_idx` ON `TravelCost`(`effective_from`, `effective_to`);

-- CreateIndex
CREATE INDEX `TravelCost_min_km_max_km_idx` ON `TravelCost`(`min_km`, `max_km`);
