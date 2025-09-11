/*
  Warnings:

  - You are about to drop the `WorkLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `WorkLog` DROP FOREIGN KEY `WorkLog_ibfk_1`;

-- DropTable
DROP TABLE `WorkLog`;
