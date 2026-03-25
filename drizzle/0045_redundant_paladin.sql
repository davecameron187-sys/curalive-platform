ALTER TABLE `ai_generated_content` MODIFY COLUMN `approved_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `occ_transcript_edits` MODIFY COLUMN `approved_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `transcript_edits` MODIFY COLUMN `approved_at` timestamp DEFAULT (now());