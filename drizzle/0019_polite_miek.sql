CREATE TABLE `speaker_pace_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` varchar(128) NOT NULL,
	`event_title` varchar(255) NOT NULL,
	`speaker` varchar(255) NOT NULL,
	`wpm` int NOT NULL,
	`pace_label` varchar(32) NOT NULL,
	`pause_score` int NOT NULL,
	`filler_word_count` int NOT NULL DEFAULT 0,
	`overall_score` int NOT NULL,
	`analysed_at` bigint NOT NULL,
	CONSTRAINT `speaker_pace_results_id` PRIMARY KEY(`id`)
);
