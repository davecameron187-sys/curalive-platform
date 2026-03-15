-- Add 'moderator' to the users.role enum
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','operator','moderator') NOT NULL DEFAULT 'user';

-- Create role_change_audit_log table
CREATE TABLE IF NOT EXISTS `role_change_audit_log` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `userId` int NOT NULL,
  `changedByUserId` int NOT NULL,
  `oldRole` enum('user','admin','operator','moderator') NOT NULL,
  `newRole` enum('user','admin','operator','moderator') NOT NULL,
  `reason` varchar(512),
  `createdAt` timestamp NOT NULL DEFAULT (now())
);
