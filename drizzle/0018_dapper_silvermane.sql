CREATE TABLE `equipment_active_rentals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`requirementId` int NOT NULL,
	`quoteId` int,
	`vendorId` int NOT NULL,
	`status` enum('scheduled','active','return_due','returned','cancelled') NOT NULL DEFAULT 'scheduled',
	`scheduledStartDate` timestamp,
	`scheduledEndDate` timestamp,
	`actualStartDate` timestamp,
	`actualReturnDate` timestamp,
	`actualRentalCost` int,
	`actualDeliveryFee` int,
	`actualPickupFee` int,
	`servicePerformanceNote` text,
	`returnConditionNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_active_rentals_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_active_rental_owner_requirement_unique` UNIQUE(`ownerId`,`requirementId`)
);
--> statement-breakpoint
CREATE TABLE `equipment_rental_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`requirementId` int NOT NULL,
	`vendorId` int NOT NULL,
	`quoteStatus` enum('requested','received','declined','expired','selected') NOT NULL DEFAULT 'requested',
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`rateUnit` enum('daily','weekly','monthly','project') NOT NULL DEFAULT 'monthly',
	`quotedRate` int,
	`deliveryFee` int,
	`pickupFee` int,
	`estimatedTotal` int,
	`quoteValidUntil` timestamp,
	`availabilityNote` text,
	`serviceNote` text,
	`termsNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_rental_quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_rental_quote_owner_requirement_vendor_unique` UNIQUE(`ownerId`,`requirementId`,`vendorId`)
);
--> statement-breakpoint
CREATE TABLE `equipment_rental_requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`projectName` varchar(255),
	`facilityName` varchar(255),
	`equipmentName` varchar(500) NOT NULL,
	`equipmentCategory` varchar(255),
	`quantity` int NOT NULL DEFAULT 1,
	`productionUse` text,
	`requiredStartDate` timestamp,
	`expectedEndDate` timestamp,
	`expectedUtilizationBps` int,
	`status` enum('draft','sourcing','quoting','selected','active','completed','cancelled') NOT NULL DEFAULT 'draft',
	`nextAction` varchar(500),
	`nextActionDueAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_rental_requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equipment_rental_vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`organizationName` varchar(255) NOT NULL,
	`vendorType` varchar(128) NOT NULL,
	`equipmentCategories` text,
	`region` varchar(128) NOT NULL,
	`city` varchar(128),
	`serviceArea` text,
	`website` text,
	`contactName` varchar(255),
	`contactTitle` varchar(255),
	`email` varchar(320),
	`phone` varchar(64),
	`equipmentFocus` text,
	`deliveryAvailable` enum('Yes','No','Unknown') NOT NULL DEFAULT 'Unknown',
	`pickupAvailable` enum('Yes','No','Unknown') NOT NULL DEFAULT 'Unknown',
	`operatorServices` enum('Yes','No','Unknown') NOT NULL DEFAULT 'Unknown',
	`shortTermRental` enum('Yes','No','Unknown') NOT NULL DEFAULT 'Unknown',
	`longTermRental` enum('Yes','No','Unknown') NOT NULL DEFAULT 'Unknown',
	`newUsedSales` enum('Yes','No','Unknown') NOT NULL DEFAULT 'Unknown',
	`serviceMaintenance` enum('Yes','No','Unknown') NOT NULL DEFAULT 'Unknown',
	`strategicFit` enum('High','Medium','Low') NOT NULL DEFAULT 'Low',
	`priority` enum('A','B','C') NOT NULL DEFAULT 'C',
	`priorityRationale` text,
	`ceRelevance` text,
	`source` varchar(255) NOT NULL,
	`sourceUrl` text NOT NULL,
	`researchDate` timestamp NOT NULL,
	`status` enum('prospect','research','qualified','passed') NOT NULL DEFAULT 'prospect',
	`nextAction` varchar(500),
	`nextActionDueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_rental_vendors_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_rental_vendor_owner_org_unique` UNIQUE(`ownerId`,`organizationName`)
);
--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `equipmentCategory` varchar(255);--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `manufacturer` varchar(255);--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `model` varchar(255);--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `equipmentCondition` varchar(64);--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `quantity` int;--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `productionUse` text;--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `expectedStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `usefulLifeMonths` int;--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `monthlyPayment` int;--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `residualBuyout` int;--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `financingProgram` varchar(255);--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `financierContactRole` varchar(255);--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `diligenceStatus` varchar(128);--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `termsState` enum('missing','estimated','quoted','approved','actual') DEFAULT 'missing' NOT NULL;--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `expectedUtilizationBps` int;--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `incrementalProduction` text;--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `incrementalRevenue` int;--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `operatingSavings` int;--> statement-breakpoint
ALTER TABLE `equipment_finance_details` ADD `financingCost` int;