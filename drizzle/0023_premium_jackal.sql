ALTER TABLE `internal_projects` ADD `knownProgramSummary` text;--> statement-breakpoint
ALTER TABLE `internal_projects` ADD `programUnitCount` int;--> statement-breakpoint
ALTER TABLE `internal_projects` ADD `programBuildingCount` int;--> statement-breakpoint
ALTER TABLE `internal_projects` ADD `programUnitsPerBuilding` int;--> statement-breakpoint
ALTER TABLE `internal_projects` ADD `programAreaSqFt` int;--> statement-breakpoint
ALTER TABLE `internal_projects` ADD `programFootprintDescription` text;--> statement-breakpoint
ALTER TABLE `internal_projects` ADD `factoryFoundationRelationship` text;--> statement-breakpoint
ALTER TABLE `internal_projects` ADD `factoryFoundationRelationshipState` enum('linked','contextual','missing') DEFAULT 'missing' NOT NULL;