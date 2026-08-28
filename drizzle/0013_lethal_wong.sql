ALTER TABLE `capital_opportunities` ADD `opportunityName` varchar(255);--> statement-breakpoint
ALTER TABLE `capital_opportunities` ADD `projectName` varchar(255);--> statement-breakpoint
ALTER TABLE `capital_opportunities` ADD `facilityName` varchar(255);--> statement-breakpoint
ALTER TABLE `capital_opportunities` ADD `contactRole` varchar(255);--> statement-breakpoint
ALTER TABLE `capital_opportunities` ADD `decisionMaker` varchar(255);--> statement-breakpoint
ALTER TABLE `capital_opportunities` ADD `relationshipStrength` varchar(128);--> statement-breakpoint
ALTER TABLE `capital_opportunities` ADD `targetCloseAt` timestamp;--> statement-breakpoint
ALTER TABLE `capital_opportunities` ADD `firstContactAt` timestamp;--> statement-breakpoint
ALTER TABLE `capital_opportunities` ADD `lastContactAt` timestamp;--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `ceContribution` int;--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `jvType` varchar(128);--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `proposedEconomics` text;--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `facilityLifecycle` varchar(128);--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `facilityPurpose` text;--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `capacity` varchar(255);--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `equipmentIncluded` text;--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `expansionPhase` varchar(128);--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `financialsReceived` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `termSheetReceived` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `loiReceived` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `legalReviewed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `siteDocumentationReceived` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `corporateDocumentationReceived` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `facility_jv_details` ADD `otherDiligenceRequirements` text;