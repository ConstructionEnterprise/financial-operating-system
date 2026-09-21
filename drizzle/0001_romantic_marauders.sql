CREATE TABLE `investor_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`firmName` varchar(255) NOT NULL,
	`contactName` varchar(255),
	`email` varchar(320) NOT NULL,
	`type` varchar(64) NOT NULL DEFAULT 'VC',
	`fitScore` int,
	`thesis` text,
	`contactUrl` text,
	`status` enum('new','drafted','approved','sent','replied','opted_out','bounced','paused') NOT NULL DEFAULT 'new',
	`initialSubject` varchar(500),
	`initialBody` text,
	`initialSentAt` timestamp,
	`followUpDueAt` timestamp,
	`followUpSubject` varchar(500),
	`followUpBody` text,
	`followUpSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investor_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outreach_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`contactId` int NOT NULL,
	`kind` varchar(64) NOT NULL,
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outreach_events_id` PRIMARY KEY(`id`)
);
