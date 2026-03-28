-- Fix schema drift by creating essential tables for console operations
-- This migration creates only the tables needed for Phase 3 console functionality

-- Create operator_sessions table if not exists
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
  KEY `eventId` (`eventId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create session_state_transitions table if not exists
CREATE TABLE IF NOT EXISTS `session_state_transitions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(128) NOT NULL,
  `operatorId` int NOT NULL,
  `fromState` enum('idle','running','paused','ended') NOT NULL,
  `toState` enum('idle','running','paused','ended') NOT NULL,
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sessionId` (`sessionId`),
  KEY `operatorId` (`operatorId`),
  FOREIGN KEY (`sessionId`) REFERENCES `operator_sessions` (`sessionId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create operator_actions table if not exists
CREATE TABLE IF NOT EXISTS `operator_actions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(128) NOT NULL,
  `operatorId` int NOT NULL,
  `actionType` enum('session_started','session_paused','session_resumed','session_ended','note_created','question_approved','question_rejected','question_answered','compliance_flag','sentiment_update') NOT NULL,
  `targetId` varchar(128),
  `targetType` varchar(64),
  `metadata` json,
  `syncedToViasocket` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sessionId` (`sessionId`),
  KEY `operatorId` (`operatorId`),
  KEY `actionType` (`actionType`),
  FOREIGN KEY (`sessionId`) REFERENCES `operator_sessions` (`sessionId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create questions table if not exists
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

-- Create transcription_segments table if not exists
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

-- Create compliance_flags table if not exists
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
