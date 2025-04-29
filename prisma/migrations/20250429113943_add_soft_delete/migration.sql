-- AlterTable
ALTER TABLE `permissions` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `role_permissions` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `roles` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `deletedAt` DATETIME(3) NULL;
