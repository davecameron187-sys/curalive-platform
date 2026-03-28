-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openId` varchar(64) NOT NULL UNIQUE,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('user','admin','operator','moderator','speaker','legal') NOT NULL DEFAULT 'user',
  `roleExpiresAt` timestamp NULL,
  `jobTitle` varchar(255),
  `organisation` varchar(255),
  `bio` text,
  `avatarUrl` text,
  `phone` varchar(64),
  `linkedinUrl` varchar(512),
  `timezone` varchar(64) DEFAULT 'Africa/Johannesburg',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `openId` (`openId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create events table
CREATE TABLE IF NOT EXISTS `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` varchar(128) NOT NULL UNIQUE,
  `title` varchar(255) NOT NULL,
  `company` varchar(255) NOT NULL,
  `platform` varchar(64) NOT NULL,
  `status` enum('upcoming','live','completed') NOT NULL DEFAULT 'upcoming',
  `accessCode` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `eventId` (`eventId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create attendee_registrations table
CREATE TABLE IF NOT EXISTS `attendee_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` varchar(128) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(320) NOT NULL,
  `company` varchar(255),
  `jobTitle` varchar(255),
  `language` varchar(64) DEFAULT 'English' NOT NULL,
  `dialIn` boolean DEFAULT false NOT NULL,
  `accessGranted` boolean DEFAULT false NOT NULL,
  `joinedAt` timestamp NULL,
  `access_pin` varchar(8),
  `pin_used_at` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `eventId` (`eventId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create operator_sessions table
CREATE TABLE IF NOT EXISTS `operator_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(128) NOT NULL UNIQUE,
  `eventId` varchar(128) NOT NULL,
  `operatorId` int NOT NULL,
  `status` enum('idle','running','paused','ended') NOT NULL DEFAULT 'idle',
  `startedAt` timestamp NULL,
  `pausedAt` timestamp NULL,
  `resumedAt` timestamp NULL,
  `endedAt` timestamp NULL,
  `totalPausedDuration` int NOT NULL DEFAULT 0,
  `handoffStatus` enum('pending','completed','failed') DEFAULT 'pending',
  `handoffCompletedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessionId` (`sessionId`),
  KEY `operatorId` (`operatorId`),
  KEY `eventId` (`eventId`),
  FOREIGN KEY (`operatorId`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create questions table
CREATE TABLE IF NOT EXISTS `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(128) NOT NULL,
  `questionText` text NOT NULL,
  `submitterName` varchar(255),
  `status` enum('submitted','approved','rejected','answered','archived') NOT NULL DEFAULT 'submitted',
  `upvotes` int DEFAULT 0,
  `complianceRiskScore` float,
  `triageScore` float,
  `priorityScore` float,
  `isAnswered` boolean NOT NULL DEFAULT false,
  `questionCategory` varchar(128),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sessionId` (`sessionId`),
  KEY `status` (`status`),
  FOREIGN KEY (`sessionId`) REFERENCES `operator_sessions` (`sessionId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create operator_actions table
CREATE TABLE IF NOT EXISTS `operator_actions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(128) NOT NULL,
  `operatorId` int NOT NULL,
  `actionType` enum('session_started','session_paused','session_resumed','session_ended','note_created','question_approved','question_rejected','question_answered','compliance_flag','sentiment_update') NOT NULL,
  `targetId` varchar(128),
  `targetType` varchar(64),
  `metadata` json,
  `syncedToViasocket` boolean NOT NULL DEFAULT false,
  `syncedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sessionId` (`sessionId`),
  KEY `operatorId` (`operatorId`),
  KEY `actionType` (`actionType`),
  FOREIGN KEY (`sessionId`) REFERENCES `operator_sessions` (`sessionId`) ON DELETE CASCADE,
  FOREIGN KEY (`operatorId`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create transcription_segments table
CREATE TABLE IF NOT EXISTS `transcription_segments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(128) NOT NULL,
  `speaker` varchar(255) NOT NULL,
  `text` text NOT NULL,
  `startTime` int,
  `endTime` int,
  `sentiment` float,
  `confidence` float,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sessionId` (`sessionId`),
  KEY `speaker` (`speaker`),
  FOREIGN KEY (`sessionId`) REFERENCES `operator_sessions` (`sessionId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create compliance_flags table
CREATE TABLE IF NOT EXISTS `compliance_flags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(128) NOT NULL,
  `questionId` int,
  `segmentId` int,
  `flagType` enum('market_sensitive','insider_info','regulatory','reputational','other') NOT NULL,
  `severity` enum('low','medium','high','critical') NOT NULL,
  `description` text,
  `resolved` boolean NOT NULL DEFAULT false,
  `resolvedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sessionId` (`sessionId`),
  KEY `questionId` (`questionId`),
  KEY `flagType` (`flagType`),
  FOREIGN KEY (`sessionId`) REFERENCES `operator_sessions` (`sessionId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create session_state_transitions table
CREATE TABLE IF NOT EXISTS `session_state_transitions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(128) NOT NULL,
  `operatorId` int NOT NULL,
  `fromState` enum('idle','running','paused','ended') NOT NULL,
  `toState` enum('idle','running','paused','ended') NOT NULL,
  `reason` varchar(255),
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sessionId` (`sessionId`),
  KEY `operatorId` (`operatorId`),
  FOREIGN KEY (`sessionId`) REFERENCES `operator_sessions` (`sessionId`) ON DELETE CASCADE,
  FOREIGN KEY (`operatorId`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create session_handoff_packages table
CREATE TABLE IF NOT EXISTS `session_handoff_packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(128) NOT NULL UNIQUE,
  `operatorId` int NOT NULL,
  `transcriptUrl` text,
  `aiReportUrl` text,
  `recordingUrl` text,
  `actionHistoryJson` json,
  `complianceFlagsJson` json,
  `questionsAnsweredCount` int NOT NULL DEFAULT 0,
  `questionsRejectedCount` int NOT NULL DEFAULT 0,
  `totalSessionDuration` int NOT NULL DEFAULT 0,
  `downloadedAt` timestamp NULL,
  `archivedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessionId` (`sessionId`),
  KEY `operatorId` (`operatorId`),
  FOREIGN KEY (`sessionId`) REFERENCES `operator_sessions` (`sessionId`) ON DELETE CASCADE,
  FOREIGN KEY (`operatorId`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
