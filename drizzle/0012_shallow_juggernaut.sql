CREATE TABLE `equipment_finance_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`capitalOpportunityId` int NOT NULL,
	`equipmentAsset` varchar(500),
	`vendor` varchar(255),
	`equipmentCost` int,
	`financingAmount` int,
	`downPayment` int,
	`termMonths` int,
	`rateBps` int,
	`structure` enum('loan','lease','other'),
	`collateral` text,
	`approvalStatus` varchar(128),
	`fundingDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_finance_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_finance_owner_opportunity_unique` UNIQUE(`ownerId`,`capitalOpportunityId`)
);
--> statement-breakpoint
CREATE TABLE `facility_jv_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`capitalOpportunityId` int NOT NULL,
	`partnerRole` varchar(255),
	`facilityContribution` int,
	`facilityDescription` text,
	`ownershipStructure` text,
	`proposedTerms` text,
	`operatorResponsibilities` text,
	`diligenceStatus` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `facility_jv_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `facility_jv_owner_opportunity_unique` UNIQUE(`ownerId`,`capitalOpportunityId`)
);
--> statement-breakpoint
CREATE TABLE `grant_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`capitalOpportunityId` int NOT NULL,
	`program` varchar(500),
	`agency` varchar(255),
	`eligibility` text,
	`awardCeiling` int,
	`matchRequirement` text,
	`applicationDeadline` timestamp,
	`eligibleCosts` text,
	`applicationStatus` varchar(128),
	`awardStatus` varchar(128),
	`reportingRequirements` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `grant_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `grant_owner_opportunity_unique` UNIQUE(`ownerId`,`capitalOpportunityId`)
);
--> statement-breakpoint
ALTER TABLE `capital_opportunities` ADD `fundedAmount` int DEFAULT 0 NOT NULL;