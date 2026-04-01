CREATE TABLE IF NOT EXISTS `diamond_pass_registrations` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `event_id` varchar(128) NOT NULL,
  `name` varchar(255) NOT NULL,
  `organisation` varchar(255) NOT NULL,
  `email` varchar(320),
  `pin` varchar(10) NOT NULL,
  `secure_token` varchar(255),
  `status` enum('registered','joined','no_show') NOT NULL DEFAULT 'registered',
  `joined_at` timestamp,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `diamond_pass_registrations_pin_unique` UNIQUE(`pin`),
  CONSTRAINT `diamond_pass_registrations_secure_token_unique` UNIQUE(`secure_token`)
);

ALTER TABLE `occ_participants`
  ADD COLUMN `twilioCallSid` varchar(128),
  ADD COLUMN `isDiamondPass` boolean NOT NULL DEFAULT false,
  ADD COLUMN `avgJitterMs` float,
  ADD COLUMN `packetLossPct` float,
  ADD COLUMN `mosScore` float;

ALTER TABLE `occ_lounge`
  ADD COLUMN `isDiamondPass` boolean NOT NULL DEFAULT false,
  ADD COLUMN `registrationId` int;
