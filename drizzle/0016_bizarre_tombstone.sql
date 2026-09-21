CREATE TABLE `roi_equipment_return_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`capitalSourceId` int NOT NULL,
	`equipmentCost` int,
	`financingCost` int,
	`annualProductivityValue` int,
	`incrementalRevenue` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roi_equipment_return_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `roi_equipment_return_owner_source_unique` UNIQUE(`ownerId`,`capitalSourceId`)
);
--> statement-breakpoint
CREATE TABLE `roi_equity_return_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`capitalSourceId` int NOT NULL,
	`dilutionBps` int,
	`investorMultipleBps` int,
	`expectedInvestorReturn` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roi_equity_return_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `roi_equity_return_owner_source_unique` UNIQUE(`ownerId`,`capitalSourceId`)
);
--> statement-breakpoint
CREATE TABLE `roi_grant_return_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`capitalSourceId` int NOT NULL,
	`awardAmount` int,
	`matchAmount` int,
	`administrativeCost` int,
	`projectValueEnabled` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roi_grant_return_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `roi_grant_return_owner_source_unique` UNIQUE(`ownerId`,`capitalSourceId`)
);
--> statement-breakpoint
CREATE TABLE `roi_jv_return_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`capitalSourceId` int NOT NULL,
	`ceContribution` int,
	`partnerContribution` int,
	`ceOwnershipBps` int,
	`expectedDistributions` int,
	`actualDistributions` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roi_jv_return_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `roi_jv_return_owner_source_unique` UNIQUE(`ownerId`,`capitalSourceId`)
);
--> statement-breakpoint
CREATE TABLE `roi_project_capital_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int NOT NULL,
	`capitalPath` enum('equity','facility_jv','equipment_finance','grants') NOT NULL,
	`capitalOpportunityId` int,
	`sourceName` varchar(255) NOT NULL,
	`capitalCommitted` int NOT NULL DEFAULT 0,
	`capitalDeployed` int NOT NULL DEFAULT 0,
	`costOfCapital` int,
	`expectedCeReturn` int,
	`actualCeReturn` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roi_project_capital_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roi_project_cash_flows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int NOT NULL,
	`monthIndex` int NOT NULL,
	`amount` int NOT NULL,
	`flowType` enum('forecast','actual') NOT NULL DEFAULT 'forecast',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roi_project_cash_flows_id` PRIMARY KEY(`id`),
	CONSTRAINT `roi_cash_flow_owner_project_month_type_unique` UNIQUE(`ownerId`,`projectId`,`monthIndex`,`flowType`)
);
--> statement-breakpoint
CREATE TABLE `roi_project_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int NOT NULL,
	`scenarioName` varchar(128) NOT NULL,
	`scenarioType` enum('base','upside','downside','custom') NOT NULL DEFAULT 'custom',
	`revenue` int,
	`cost` int,
	`capitalRequired` int,
	`periodMonths` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roi_project_scenarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `roi_scenario_owner_project_name_unique` UNIQUE(`ownerId`,`projectId`,`scenarioName`)
);
--> statement-breakpoint
CREATE TABLE `roi_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectName` varchar(255) NOT NULL,
	`projectStatus` enum('planning','active','completed','paused') NOT NULL DEFAULT 'planning',
	`description` text,
	`capitalRequirement` int,
	`capitalDeployedActual` int,
	`projectedRevenue` int,
	`actualRevenue` int,
	`projectedCost` int,
	`actualCost` int,
	`projectionPeriodMonths` int,
	`actualPeriodMonths` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roi_projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `roi_project_owner_name_unique` UNIQUE(`ownerId`,`projectName`)
);
