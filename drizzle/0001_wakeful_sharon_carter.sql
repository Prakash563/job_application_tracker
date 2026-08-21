CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`company` varchar(160) NOT NULL,
	`role` varchar(160) NOT NULL,
	`location` varchar(160),
	`salaryRange` varchar(120),
	`applicationDate` timestamp NOT NULL,
	`application_status` enum('Saved','Applied','Interview','Offer','Rejected','Withdrawn') NOT NULL DEFAULT 'Saved',
	`notes` text,
	`jobUrl` varchar(2048),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resume_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resumeId` int NOT NULL,
	`applicationId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resume_applications_id` PRIMARY KEY(`id`),
	CONSTRAINT `resume_application_unique` UNIQUE(`resumeId`,`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`fileSize` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(1024) NOT NULL,
	`resumeText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`applicationId` int NOT NULL,
	`resumeId` int,
	`match_source` enum('resume','manual-skills') NOT NULL,
	`inputSkills` text NOT NULL,
	`jobDescription` text NOT NULL,
	`matchedSkills` json NOT NULL,
	`missingSkills` json NOT NULL,
	`strengths` json NOT NULL,
	`nextActions` json NOT NULL,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skill_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resume_applications` ADD CONSTRAINT `resume_applications_resumeId_resumes_id_fk` FOREIGN KEY (`resumeId`) REFERENCES `resumes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resume_applications` ADD CONSTRAINT `resume_applications_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumes` ADD CONSTRAINT `resumes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_matches` ADD CONSTRAINT `skill_matches_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_matches` ADD CONSTRAINT `skill_matches_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_matches` ADD CONSTRAINT `skill_matches_resumeId_resumes_id_fk` FOREIGN KEY (`resumeId`) REFERENCES `resumes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `applications_user_status_idx` ON `applications` (`userId`,`application_status`);--> statement-breakpoint
CREATE INDEX `applications_user_date_idx` ON `applications` (`userId`,`applicationDate`);--> statement-breakpoint
CREATE INDEX `resume_applications_application_idx` ON `resume_applications` (`applicationId`);--> statement-breakpoint
CREATE INDEX `resumes_user_created_idx` ON `resumes` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `skill_matches_user_application_idx` ON `skill_matches` (`userId`,`applicationId`);