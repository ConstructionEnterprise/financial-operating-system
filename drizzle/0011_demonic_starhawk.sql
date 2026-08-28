CREATE TABLE `capital_buckets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`capitalPath` enum('equity','facility_jv','equipment_finance','grants') NOT NULL,
	`targetAmount` int NOT NULL DEFAULT 0,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `capital_buckets_id` PRIMARY KEY(`id`),
	CONSTRAINT `capital_bucket_owner_path_unique` UNIQUE(`ownerId`,`capitalPath`)
);
--> statement-breakpoint
CREATE TABLE `capital_opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`capitalPath` enum('equity','facility_jv','equipment_finance','grants') NOT NULL,
	`organizationName` varchar(255) NOT NULL,
	`contactName` varchar(255),
	`email` varchar(320),
	`contactUrl` text,
	`stage` enum('identified','researching','outreach','meeting','diligence','term_sheet','committed','passed') NOT NULL DEFAULT 'identified',
	`requestedAmount` int,
	`committedAmount` int NOT NULL DEFAULT 0,
	`probability` int NOT NULL DEFAULT 0,
	`linkedInvestorId` int,
	`campaignId` int,
	`source` varchar(255),
	`termsNotes` text,
	`nextAction` varchar(500),
	`nextActionDueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `capital_opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `capital_opportunity_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`capitalOpportunityId` int NOT NULL,
	`documentId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `capital_opportunity_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `capital_opportunity_document_owner_unique` UNIQUE(`ownerId`,`capitalOpportunityId`,`documentId`)
);
--> statement-breakpoint
ALTER TABLE `meetings` ADD `capitalOpportunityId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `capitalOpportunityId` int;