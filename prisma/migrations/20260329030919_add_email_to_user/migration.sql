/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Panchayat_constituencyId_fkey` ON `panchayat`;

-- DropIndex
DROP INDEX `User_constituencyId_fkey` ON `user`;

-- DropIndex
DROP INDEX `User_panchayatId_fkey` ON `user`;

-- DropIndex
DROP INDEX `User_partyId_fkey` ON `user`;

-- DropIndex
DROP INDEX `User_wardId_fkey` ON `user`;

-- DropIndex
DROP INDEX `Voter_wardId_fkey` ON `voter`;

-- DropIndex
DROP INDEX `VoterMark_markedBy_fkey` ON `votermark`;

-- DropIndex
DROP INDEX `VoterMark_partyId_fkey` ON `votermark`;

-- DropIndex
DROP INDEX `Ward_panchayatId_fkey` ON `ward`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `email` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);

-- AddForeignKey
ALTER TABLE `Panchayat` ADD CONSTRAINT `Panchayat_constituencyId_fkey` FOREIGN KEY (`constituencyId`) REFERENCES `Constituency`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ward` ADD CONSTRAINT `Ward_panchayatId_fkey` FOREIGN KEY (`panchayatId`) REFERENCES `Panchayat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_partyId_fkey` FOREIGN KEY (`partyId`) REFERENCES `Party`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_constituencyId_fkey` FOREIGN KEY (`constituencyId`) REFERENCES `Constituency`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_panchayatId_fkey` FOREIGN KEY (`panchayatId`) REFERENCES `Panchayat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_wardId_fkey` FOREIGN KEY (`wardId`) REFERENCES `Ward`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Voter` ADD CONSTRAINT `Voter_wardId_fkey` FOREIGN KEY (`wardId`) REFERENCES `Ward`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VoterMark` ADD CONSTRAINT `VoterMark_voterId_fkey` FOREIGN KEY (`voterId`) REFERENCES `Voter`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VoterMark` ADD CONSTRAINT `VoterMark_partyId_fkey` FOREIGN KEY (`partyId`) REFERENCES `Party`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VoterMark` ADD CONSTRAINT `VoterMark_markedBy_fkey` FOREIGN KEY (`markedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
