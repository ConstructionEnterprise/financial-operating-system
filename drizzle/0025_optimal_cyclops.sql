CREATE TABLE `project_projection_assumptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`scenarioId` int NOT NULL,
	`assumptionCategory` varchar(128) NOT NULL,
	`metric` varchar(128) NOT NULL,
	`value` int,
	`valueUnit` enum('usd','units','percentage_bps','months','other') NOT NULL DEFAULT 'usd',
	`periodStartMonth` int,
	`periodEndMonth` int,
	`dataState` enum('projected','estimated') NOT NULL,
	`sourceReference` varchar(500),
	`effectiveAt` timestamp,
	`ownerName` varchar(255),
	`notes` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_projection_assumptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_projection_monthly_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`scenarioId` int NOT NULL,
	`monthIndex` int NOT NULL,
	`phase` enum('predevelopment','construction','commissioning','operating_ramp','stabilized_operations') NOT NULL,
	`metricCategory` enum('revenue','operating_cost','capital_deployment','financing_cost','funding_draw','ce_capital_contribution','ce_distribution') NOT NULL,
	`deploymentCategory` enum('land_site','building','equipment','robotics_automation','technology','soft_costs','contingency','working_capital','other'),
	`amount` int,
	`dataState` enum('projected','estimated') NOT NULL,
	`sourceReference` varchar(500),
	`effectiveAt` timestamp,
	`ownerName` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_projection_monthly_lines_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_projection_monthly_line_owner_unique` UNIQUE(`ownerId`,`scenarioId`,`monthIndex`,`metricCategory`,`deploymentCategory`)
);
--> statement-breakpoint
CREATE TABLE `project_projection_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`modelId` int NOT NULL,
	`scenarioName` varchar(255) NOT NULL,
	`scenarioType` enum('downside','base','upside','custom') NOT NULL,
	`scenarioStatus` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_projection_scenarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_projection_scenario_owner_model_name_unique` UNIQUE(`ownerId`,`modelId`,`scenarioName`)
);
