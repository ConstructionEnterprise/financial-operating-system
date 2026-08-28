CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`funnelStage` varchar(64) NOT NULL DEFAULT '1,000',
	`targetCount` int,
	`status` enum('planning','active','paused','completed') NOT NULL DEFAULT 'planning',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`investorId` int,
	`campaignId` int,
	`title` varchar(255) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`investorId` int,
	`campaignId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('open','in_progress','done','snoozed') NOT NULL DEFAULT 'open',
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `investor_contacts` ADD `campaignId` int;--> statement-breakpoint
ALTER TABLE `investor_contacts` ADD `relationshipStage` enum('identified','researched','contacted','engaged','meeting','diligence','committed','passed') DEFAULT 'identified' NOT NULL;--> statement-breakpoint
ALTER TABLE `investor_contacts` ADD `checkSizeMin` int;--> statement-breakpoint
ALTER TABLE `investor_contacts` ADD `checkSizeMax` int;--> statement-breakpoint
ALTER TABLE `investor_contacts` ADD `geography` varchar(128);--> statement-breakpoint
ALTER TABLE `investor_contacts` ADD `relationshipOwner` varchar(255);--> statement-breakpoint
ALTER TABLE `investor_contacts` ADD `nextAction` varchar(500);--> statement-breakpoint
ALTER TABLE `investor_contacts` ADD `nextActionDueAt` timestamp;--> statement-breakpoint
ALTER TABLE `investor_contacts` ADD `source` varchar(128);--> statement-breakpoint
ALTER TABLE `investor_contacts` ADD `notes` text;