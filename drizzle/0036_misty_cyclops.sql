ALTER TABLE `occ_transcription_segments` ADD `sentiment` enum('positive','neutral','negative');--> statement-breakpoint
ALTER TABLE `occ_transcription_segments` ADD `sentiment_confidence` int;--> statement-breakpoint
ALTER TABLE `occ_transcription_segments` ADD `emotion` enum('happy','sad','angry','surprised','fearful','disgusted','neutral');--> statement-breakpoint
ALTER TABLE `occ_transcription_segments` ADD `emotion_score` int;--> statement-breakpoint
ALTER TABLE `occ_transcription_segments` ADD `key_phrases` text;--> statement-breakpoint
ALTER TABLE `occ_transcription_segments` ADD `tone` enum('professional','casual','formal','aggressive','supportive');