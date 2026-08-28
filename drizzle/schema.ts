import { relations } from "drizzle-orm";
import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  groupName: varchar("groupName", { length: 128 }).notNull().default("Ungrouped"),
  sortOrder: int("sortOrder").notNull().default(0),
  funnelStage: varchar("funnelStage", { length: 64 }).notNull().default("1,000"),
  targetCount: int("targetCount"),
  status: mysqlEnum("status", ["planning", "active", "paused", "completed"]).notNull().default("planning"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const fundraisingDocuments = mysqlTable("fundraising_documents", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }).notNull().default("Supporting material"),
  version: varchar("version", { length: 64 }).notNull().default("v1"),
  status: mysqlEnum("status", ["current", "archived"]).notNull().default("current"),
  audience: varchar("audience", { length: 128 }).notNull().default("General"),
  purpose: varchar("purpose", { length: 255 }).notNull().default("General fundraising"),
  replacesDocumentId: int("replacesDocumentId"),
  description: text("description"),
  mimeType: varchar("mimeType", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  storageUrl: text("storageUrl").notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const campaignDocuments = mysqlTable("campaign_documents", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  campaignId: int("campaignId").notNull(),
  documentId: int("documentId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  ownerCampaignDocumentUnique: uniqueIndex("campaign_document_owner_unique").on(table.ownerId, table.campaignId, table.documentId),
}));

export const investorDocuments = mysqlTable("investor_documents", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  contactId: int("contactId").notNull(),
  documentId: int("documentId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  ownerInvestorDocumentUnique: uniqueIndex("investor_document_owner_unique").on(table.ownerId, table.contactId, table.documentId),
}));

export const investorContacts = mysqlTable("investor_contacts", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  firmName: varchar("firmName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  type: varchar("type", { length: 64 }).notNull().default("VC"),
  fitScore: int("fitScore"),
  thesis: text("thesis"),
  contactUrl: text("contactUrl"),
  campaignId: int("campaignId"),
  relationshipStage: mysqlEnum("relationshipStage", ["identified", "researched", "contacted", "engaged", "meeting", "diligence", "committed", "passed"]).notNull().default("identified"),
  checkSizeMin: int("checkSizeMin"),
  checkSizeMax: int("checkSizeMax"),
  geography: varchar("geography", { length: 128 }),
  relationshipOwner: varchar("relationshipOwner", { length: 255 }),
  nextAction: varchar("nextAction", { length: 500 }),
  nextActionDueAt: timestamp("nextActionDueAt"),
  source: varchar("source", { length: 128 }),
  notes: text("notes"),
  investorLanguage: varchar("investorLanguage", { length: 255 }),
  portfolioHighlights: text("portfolioHighlights"),
  likelyObjections: text("likelyObjections"),
  bestPitchAngle: text("bestPitchAngle"),
  warmIntroPath: text("warmIntroPath"),
  assetClassPreference: varchar("assetClassPreference", { length: 255 }),
  geographicPreference: varchar("geographicPreference", { length: 255 }),
  riskTolerance: varchar("riskTolerance", { length: 128 }),
  returnExpectations: varchar("returnExpectations", { length: 255 }),
  capitalPreference: varchar("capitalPreference", { length: 128 }),
  investmentHorizon: varchar("investmentHorizon", { length: 128 }),
  decisionStructure: text("decisionStructure"),
  decisionCycle: varchar("decisionCycle", { length: 128 }),
  communicationPreference: varchar("communicationPreference", { length: 255 }),
  relationshipStrength: varchar("relationshipStrength", { length: 128 }),
  historicalCommitments: text("historicalCommitments"),
  relevantProjects: text("relevantProjects"),
  status: mysqlEnum("status", ["new", "drafted", "approved", "sent", "replied", "opted_out", "bounced", "paused"]).notNull().default("new"),
  initialSubject: varchar("initialSubject", { length: 500 }),
  initialBody: text("initialBody"),
  initialSentAt: timestamp("initialSentAt"),
  followUpDueAt: timestamp("followUpDueAt"),
  followUpSubject: varchar("followUpSubject", { length: 500 }),
  followUpBody: text("followUpBody"),
  followUpSentAt: timestamp("followUpSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerEmailUnique: uniqueIndex("investor_owner_email_unique").on(table.ownerId, table.email),
}));

export const capitalBuckets = mysqlTable("capital_buckets", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  capitalPath: mysqlEnum("capitalPath", ["equity", "facility_jv", "equipment_finance", "grants"]).notNull(),
  targetAmount: int("targetAmount").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerCapitalPathUnique: uniqueIndex("capital_bucket_owner_path_unique").on(table.ownerId, table.capitalPath),
}));

export const jvPartnerProspects = mysqlTable("jv_partner_prospects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  organizationName: varchar("organizationName", { length: 255 }).notNull(),
  partnerType: varchar("partnerType", { length: 128 }).notNull(),
  region: varchar("region", { length: 128 }).notNull(),
  city: varchar("city", { length: 128 }),
  submarket: varchar("submarket", { length: 255 }),
  website: text("website"),
  contactName: varchar("contactName", { length: 255 }),
  contactTitle: varchar("contactTitle", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 64 }),
  linkedInUrl: text("linkedInUrl"),
  assetFocus: text("assetFocus"),
  developmentFocus: text("developmentFocus"),
  texasMarkets: text("texasMarkets"),
  typicalProjectScale: varchar("typicalProjectScale", { length: 255 }),
  jvExperience: text("jvExperience"),
  landContributionPotential: varchar("landContributionPotential", { length: 32 }).notNull().default("Unknown"),
  capitalContributionPotential: varchar("capitalContributionPotential", { length: 32 }).notNull().default("Unknown"),
  developmentContributionPotential: varchar("developmentContributionPotential", { length: 32 }).notNull().default("Unknown"),
  facilityContributionPotential: varchar("facilityContributionPotential", { length: 32 }).notNull().default("Unknown"),
  strategicFit: varchar("strategicFit", { length: 32 }).notNull().default("Low"),
  priority: mysqlEnum("priority", ["A", "B", "C"]).notNull().default("C"),
  priorityRationale: text("priorityRationale"),
  ceRelevance: text("ceRelevance"),
  jvThesis: text("jvThesis"),
  source: varchar("source", { length: 255 }).notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  researchDate: timestamp("researchDate").notNull(),
  status: mysqlEnum("status", ["prospect", "research", "qualified", "converted", "passed"]).notNull().default("prospect"),
  indicativeCapitalAmount: int("indicativeCapitalAmount"),
  nextAction: varchar("nextAction", { length: 500 }),
  nextActionDueAt: timestamp("nextActionDueAt"),
  convertedCapitalOpportunityId: int("convertedCapitalOpportunityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerOrganizationUnique: uniqueIndex("jv_prospect_owner_organization_unique").on(table.ownerId, table.organizationName),
}));

export const capitalOpportunities = mysqlTable("capital_opportunities", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  capitalPath: mysqlEnum("capitalPath", ["equity", "facility_jv", "equipment_finance", "grants"]).notNull(),
  organizationName: varchar("organizationName", { length: 255 }).notNull(),
  opportunityName: varchar("opportunityName", { length: 255 }),
  internalProjectId: int("internalProjectId"),
  projectName: varchar("projectName", { length: 255 }),
  facilityName: varchar("facilityName", { length: 255 }),
  contactName: varchar("contactName", { length: 255 }),
  contactRole: varchar("contactRole", { length: 255 }),
  decisionMaker: varchar("decisionMaker", { length: 255 }),
  relationshipStrength: varchar("relationshipStrength", { length: 128 }),
  email: varchar("email", { length: 320 }),
  contactUrl: text("contactUrl"),
  stage: mysqlEnum("stage", ["identified", "researching", "outreach", "meeting", "diligence", "term_sheet", "committed", "passed"]).notNull().default("identified"),
  requestedAmount: int("requestedAmount"),
  committedAmount: int("committedAmount").notNull().default(0),
  fundedAmount: int("fundedAmount").notNull().default(0),
  probability: int("probability").notNull().default(0),
  linkedInvestorId: int("linkedInvestorId"),
  campaignId: int("campaignId"),
  source: varchar("source", { length: 255 }),
  termsNotes: text("termsNotes"),
  nextAction: varchar("nextAction", { length: 500 }),
  nextActionDueAt: timestamp("nextActionDueAt"),
  targetCloseAt: timestamp("targetCloseAt"),
  firstContactAt: timestamp("firstContactAt"),
  lastContactAt: timestamp("lastContactAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Internal Projects are the company-side context that capital paths and ROI models support.
 * They are deliberately not a capital path and do not represent a fundraising pipeline.
 */
export const internalProjects = mysqlTable("internal_projects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectName: varchar("projectName", { length: 255 }).notNull(),
  projectCode: varchar("projectCode", { length: 128 }),
  projectType: varchar("projectType", { length: 128 }),
  location: varchar("location", { length: 255 }),
  projectStatus: mysqlEnum("projectStatus", ["planning", "active", "on_hold", "completed", "cancelled"]).notNull().default("planning"),
  developmentStage: mysqlEnum("developmentStage", ["concept", "predevelopment", "development", "construction", "commissioning", "operations", "completed"]).notNull().default("concept"),
  sponsorEntity: varchar("sponsorEntity", { length: 255 }),
  knownProgramSummary: text("knownProgramSummary"),
  programUnitCount: int("programUnitCount"),
  programBuildingCount: int("programBuildingCount"),
  programUnitsPerBuilding: int("programUnitsPerBuilding"),
  programAreaSqFt: int("programAreaSqFt"),
  programFootprintDescription: text("programFootprintDescription"),
  factoryFoundationRelationship: text("factoryFoundationRelationship"),
  factoryFoundationRelationshipState: mysqlEnum("factoryFoundationRelationshipState", ["linked", "contextual", "missing"]).notNull().default("missing"),
  totalProjectCost: int("totalProjectCost"),
  totalProjectCostDataState: mysqlEnum("totalProjectCostDataState", ["actual", "projected", "estimated", "missing"]).notNull().default("missing"),
  capitalRequirement: int("capitalRequirement"),
  capitalRequirementDataState: mysqlEnum("capitalRequirementDataState", ["actual", "projected", "estimated", "missing"]).notNull().default("missing"),
  targetCompletionAt: timestamp("targetCompletionAt"),
  linkedFfProject: varchar("linkedFfProject", { length: 255 }),
  roiProjectId: int("roiProjectId"),
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerProjectNameUnique: uniqueIndex("internal_project_owner_name_unique").on(table.ownerId, table.projectName),
  ownerProjectCodeUnique: uniqueIndex("internal_project_owner_code_unique").on(table.ownerId, table.projectCode),
}));

/** A recorded use of capital for an Internal Project; blank amounts remain explicitly missing. */
export const internalProjectCapitalNeeds = mysqlTable("internal_project_capital_needs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  internalProjectId: int("internalProjectId").notNull(),
  requirementName: varchar("requirementName", { length: 255 }).notNull(),
  requirementCategory: varchar("requirementCategory", { length: 128 }).notNull().default("other"),
  amount: int("amount"),
  amountDataState: mysqlEnum("amountDataState", ["actual", "projected", "estimated", "missing"]).notNull().default("missing"),
  notes: text("notes"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** A capital need can be appropriate for multiple strategies without creating capital opportunities. */
export const internalProjectCapitalNeedStrategies = mysqlTable("internal_project_capital_need_strategies", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  capitalNeedId: int("capitalNeedId").notNull(),
  strategyType: mysqlEnum("strategyType", ["equity", "facility_jv", "equipment_finance", "grants", "other"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  ownerNeedStrategyUnique: uniqueIndex("internal_project_need_strategy_owner_unique").on(table.ownerId, table.capitalNeedId, table.strategyType),
}));

/** Projects contextualize existing document-library records; files and document metadata remain canonical elsewhere. */
export const internalProjectDocuments = mysqlTable("internal_project_documents", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  internalProjectId: int("internalProjectId").notNull(),
  documentId: int("documentId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  ownerProjectDocumentUnique: uniqueIndex("internal_project_document_owner_unique").on(table.ownerId, table.internalProjectId, table.documentId),
}));

/** Governed project-economics model shell. It is an Internal Project extension, not a duplicate ROI project. */
export const projectEconomicsModels = mysqlTable("project_economics_models", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  internalProjectId: int("internalProjectId").notNull(),
  modelName: varchar("modelName", { length: 255 }).notNull(),
  modelStatus: mysqlEnum("modelStatus", ["shell", "active", "archived"]).notNull().default("shell"),
  horizonMonths: int("horizonMonths").notNull().default(36),
  modelStartAt: timestamp("modelStartAt"),
  modelStartDataState: mysqlEnum("modelStartDataState", ["actual", "projected", "estimated", "missing"]).notNull().default("missing"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerInternalProjectUnique: uniqueIndex("project_economics_model_owner_project_unique").on(table.ownerId, table.internalProjectId),
}));

/** A model input retains its value state and provenance; a missing input is never coerced to zero. */
export const projectEconomicsInputs = mysqlTable("project_economics_inputs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  modelId: int("modelId").notNull(),
  inputArea: mysqlEnum("inputArea", ["uses", "operations", "sources"]).notNull(),
  inputCategory: varchar("inputCategory", { length: 128 }).notNull(),
  inputName: varchar("inputName", { length: 255 }).notNull(),
  value: int("value"),
  valueUnit: mysqlEnum("valueUnit", ["usd", "units", "percentage_bps", "hours", "other"]).notNull().default("usd"),
  dataState: mysqlEnum("dataState", ["actual", "projected", "estimated", "missing"]).notNull().default("missing"),
  sourceReference: varchar("sourceReference", { length: 500 }),
  effectiveAt: timestamp("effectiveAt"),
  ownerName: varchar("ownerName", { length: 255 }),
  linkedCapitalOpportunityId: int("linkedCapitalOpportunityId"),
  notes: text("notes"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Monthly schedule items accept capex, source draws, operating cash flow, debt service, grant receipts, and collections only when recorded. */
export const projectEconomicsMonthlyItems = mysqlTable("project_economics_monthly_items", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  modelId: int("modelId").notNull(),
  monthIndex: int("monthIndex").notNull(),
  phase: mysqlEnum("phase", ["predevelopment", "design_entitlement", "construction", "building_completion", "lease_up_stabilization", "commissioning", "operating_ramp"]).notNull(),
  category: mysqlEnum("category", ["capex", "draw", "operating_cash_flow", "debt_service", "grant_disbursement", "revenue_collections"]).notNull(),
  amount: int("amount"),
  dataState: mysqlEnum("dataState", ["actual", "projected", "estimated", "missing"]).notNull().default("missing"),
  sourceReference: varchar("sourceReference", { length: 500 }),
  effectiveAt: timestamp("effectiveAt"),
  ownerName: varchar("ownerName", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerModelMonthCategoryUnique: uniqueIndex("project_economics_month_item_owner_unique").on(table.ownerId, table.modelId, table.monthIndex, table.category),
}));

/** Existing Document Library files may be attached to a specific governed model input without duplicating files. */
export const projectEconomicsInputDocuments = mysqlTable("project_economics_input_documents", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  modelInputId: int("modelInputId").notNull(),
  documentId: int("documentId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  ownerInputDocumentUnique: uniqueIndex("project_economics_input_document_owner_unique").on(table.ownerId, table.modelInputId, table.documentId),
}));

/** Projection scenarios are forward-looking containers; they never modify the governed project-economics record or actual ROI data. */
export const projectProjectionScenarios = mysqlTable("project_projection_scenarios", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  modelId: int("modelId").notNull(),
  scenarioName: varchar("scenarioName", { length: 255 }).notNull(),
  scenarioType: mysqlEnum("scenarioType", ["downside", "base", "upside", "custom"]).notNull(),
  scenarioStatus: mysqlEnum("scenarioStatus", ["draft", "active", "archived"]).notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerModelNameUnique: uniqueIndex("project_projection_scenario_owner_model_name_unique").on(table.ownerId, table.modelId, table.scenarioName),
}));

/** Every projection assumption is scenario-isolated and may only be projected or estimated—not actual. */
export const projectProjectionAssumptions = mysqlTable("project_projection_assumptions", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  scenarioId: int("scenarioId").notNull(),
  assumptionCategory: varchar("assumptionCategory", { length: 128 }).notNull(),
  metric: varchar("metric", { length: 128 }).notNull(),
  value: int("value"),
  valueUnit: mysqlEnum("valueUnit", ["usd", "units", "percentage_bps", "months", "other"]).notNull().default("usd"),
  periodStartMonth: int("periodStartMonth"),
  periodEndMonth: int("periodEndMonth"),
  dataState: mysqlEnum("dataState", ["projected", "estimated"]).notNull(),
  sourceReference: varchar("sourceReference", { length: 500 }),
  effectiveAt: timestamp("effectiveAt"),
  ownerName: varchar("ownerName", { length: 255 }),
  notes: text("notes"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Projection time-series values use explicit sign conventions and remain isolated to their scenario. */
export const projectProjectionMonthlyLines = mysqlTable("project_projection_monthly_lines", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  scenarioId: int("scenarioId").notNull(),
  monthIndex: int("monthIndex").notNull(),
  phase: mysqlEnum("phase", ["predevelopment", "design_entitlement", "construction", "building_completion", "lease_up_stabilization", "commissioning", "operating_ramp", "stabilized_operations"]).notNull(),
  metricCategory: mysqlEnum("metricCategory", ["revenue", "operating_cost", "capital_deployment", "financing_cost", "funding_draw", "ce_capital_contribution", "ce_distribution"]).notNull(),
  deploymentCategory: mysqlEnum("deploymentCategory", ["not_applicable", "land_site", "building", "furniture_fixtures_equipment", "equipment", "robotics_automation", "technology", "soft_costs", "contingency", "working_capital", "other"]).notNull().default("not_applicable"),
  amount: int("amount"),
  dataState: mysqlEnum("dataState", ["projected", "estimated"]).notNull(),
  sourceReference: varchar("sourceReference", { length: 500 }),
  effectiveAt: timestamp("effectiveAt"),
  ownerName: varchar("ownerName", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerScenarioMonthMetricDeploymentUnique: uniqueIndex("project_projection_monthly_line_owner_unique").on(table.ownerId, table.scenarioId, table.monthIndex, table.metricCategory, table.deploymentCategory),
}));

/** Scenario-isolated WBS leaves retain historical planning allocations without representing invoices, capital commitments, or actual cash flow. */
export const projectPlanningWbsLines = mysqlTable("project_planning_wbs_lines", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  internalProjectId: int("internalProjectId").notNull(),
  projectionScenarioId: int("projectionScenarioId").notNull(),
  wbsCode: varchar("wbsCode", { length: 32 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  costCategory: varchar("costCategory", { length: 128 }).notNull(),
  phase: varchar("phase", { length: 128 }).notNull(),
  buildingApplicability: varchar("buildingApplicability", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  quantityUnit: varchar("quantityUnit", { length: 64 }).notNull(),
  unitCost: int("unitCost").notNull(),
  allocatedAmount: int("allocatedAmount").notNull(),
  dataState: mysqlEnum("dataState", ["actual", "projected", "estimated", "missing"]).notNull().default("estimated"),
  sourceClassification: mysqlEnum("sourceClassification", ["historical_control", "reverse_engineered_allocation", "derived_quantity", "source_document"]).notNull().default("reverse_engineered_allocation"),
  sourceReference: varchar("sourceReference", { length: 500 }),
  effectiveAt: timestamp("effectiveAt"),
  ownerName: varchar("ownerName", { length: 255 }),
  notes: text("notes"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerScenarioWbsCodeUnique: uniqueIndex("project_planning_wbs_owner_scenario_code_unique").on(table.ownerId, table.projectionScenarioId, table.wbsCode),
}));

/** Scenario-isolated monthly construction-spend and lease-up occupancy planning inputs. They are never actual project records. */
export const projectPlanningScheduleMonths = mysqlTable("project_planning_schedule_months", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  internalProjectId: int("internalProjectId").notNull(),
  projectionScenarioId: int("projectionScenarioId").notNull(),
  monthIndex: int("monthIndex").notNull(),
  phase: mysqlEnum("phase", ["predevelopment", "design_entitlement", "construction", "building_completion", "lease_up_stabilization", "commissioning", "operating_ramp", "stabilized_operations"]).notNull(),
  constructionSpendBps: int("constructionSpendBps"),
  occupancyBps: int("occupancyBps"),
  dataState: mysqlEnum("dataState", ["projected", "estimated"]).notNull(),
  sourceReference: varchar("sourceReference", { length: 500 }),
  effectiveAt: timestamp("effectiveAt"),
  ownerName: varchar("ownerName", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerScenarioMonthUnique: uniqueIndex("project_planning_schedule_owner_scenario_month_unique").on(table.ownerId, table.projectionScenarioId, table.monthIndex),
}));

/** Financing terms are scenario-only inputs. Debt service is calculated only after validation; no commitment or funded capital is created. */
export const projectPlanningFinancingTerms = mysqlTable("project_planning_financing_terms", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  internalProjectId: int("internalProjectId").notNull(),
  projectionScenarioId: int("projectionScenarioId").notNull(),
  loanAmount: int("loanAmount"),
  annualInterestRateBps: int("annualInterestRateBps"),
  financingFeeBps: int("financingFeeBps"),
  termMonths: int("termMonths"),
  amortizationMonths: int("amortizationMonths"),
  interestOnlyMonths: int("interestOnlyMonths"),
  closingMonth: int("closingMonth"),
  dataState: mysqlEnum("dataState", ["projected", "estimated"]).notNull(),
  sourceReference: varchar("sourceReference", { length: 500 }),
  effectiveAt: timestamp("effectiveAt"),
  ownerName: varchar("ownerName", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerScenarioUnique: uniqueIndex("project_planning_financing_owner_scenario_unique").on(table.ownerId, table.projectionScenarioId),
}));

/** Scenario-isolated rent-roll drivers for configurable residential underwriting; each record retains independent provenance. */
export const projectProjectionUnitMixes = mysqlTable("project_projection_unit_mixes", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  scenarioId: int("scenarioId").notNull(),
  unitType: varchar("unitType", { length: 128 }).notNull(),
  unitCount: int("unitCount").notNull(),
  averageSqFt: int("averageSqFt"),
  monthlyRent: int("monthlyRent"),
  dataState: mysqlEnum("dataState", ["projected", "estimated"]).notNull(),
  sourceReference: varchar("sourceReference", { length: 500 }),
  effectiveAt: timestamp("effectiveAt"),
  ownerName: varchar("ownerName", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerScenarioUnitTypeUnique: uniqueIndex("project_projection_unit_mix_owner_scenario_type_unique").on(table.ownerId, table.scenarioId, table.unitType),
}));

export const roiProjects = mysqlTable("roi_projects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectName: varchar("projectName", { length: 255 }).notNull(),
  projectStatus: mysqlEnum("projectStatus", ["planning", "active", "completed", "paused"]).notNull().default("planning"),
  description: text("description"),
  capitalRequirement: int("capitalRequirement"),
  capitalDeployedActual: int("capitalDeployedActual"),
  projectedRevenue: int("projectedRevenue"),
  actualRevenue: int("actualRevenue"),
  projectedCost: int("projectedCost"),
  actualCost: int("actualCost"),
  projectionPeriodMonths: int("projectionPeriodMonths"),
  actualPeriodMonths: int("actualPeriodMonths"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerProjectUnique: uniqueIndex("roi_project_owner_name_unique").on(table.ownerId, table.projectName),
}));

export const roiProjectCapitalSources = mysqlTable("roi_project_capital_sources", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId").notNull(),
  capitalPath: mysqlEnum("capitalPath", ["equity", "facility_jv", "equipment_finance", "grants"]).notNull(),
  capitalOpportunityId: int("capitalOpportunityId"),
  sourceName: varchar("sourceName", { length: 255 }).notNull(),
  capitalCommitted: int("capitalCommitted").notNull().default(0),
  capitalDeployed: int("capitalDeployed").notNull().default(0),
  costOfCapital: int("costOfCapital"),
  expectedCeReturn: int("expectedCeReturn"),
  actualCeReturn: int("actualCeReturn"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const roiEquityReturnDetails = mysqlTable("roi_equity_return_details", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  capitalSourceId: int("capitalSourceId").notNull(),
  dilutionBps: int("dilutionBps"),
  investorMultipleBps: int("investorMultipleBps"),
  expectedInvestorReturn: int("expectedInvestorReturn"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerSourceUnique: uniqueIndex("roi_equity_return_owner_source_unique").on(table.ownerId, table.capitalSourceId),
}));

export const roiJvReturnDetails = mysqlTable("roi_jv_return_details", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  capitalSourceId: int("capitalSourceId").notNull(),
  ceContribution: int("ceContribution"),
  partnerContribution: int("partnerContribution"),
  ceOwnershipBps: int("ceOwnershipBps"),
  expectedDistributions: int("expectedDistributions"),
  actualDistributions: int("actualDistributions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerSourceUnique: uniqueIndex("roi_jv_return_owner_source_unique").on(table.ownerId, table.capitalSourceId),
}));

export const roiJvContributionComponents = mysqlTable("roi_jv_contribution_components", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  capitalSourceId: int("capitalSourceId").notNull(),
  contributor: mysqlEnum("contributor", ["ce", "partner"]).notNull(),
  componentType: mysqlEnum("componentType", ["cash", "technology", "equipment", "operations", "ip_systems", "land", "facility", "financing", "development_services", "other"]).notNull(),
  amount: int("amount").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const roiEquipmentReturnDetails = mysqlTable("roi_equipment_return_details", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  capitalSourceId: int("capitalSourceId").notNull(),
  equipmentCost: int("equipmentCost"),
  financingCost: int("financingCost"),
  annualProductivityValue: int("annualProductivityValue"),
  incrementalRevenue: int("incrementalRevenue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerSourceUnique: uniqueIndex("roi_equipment_return_owner_source_unique").on(table.ownerId, table.capitalSourceId),
}));

export const roiGrantReturnDetails = mysqlTable("roi_grant_return_details", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  capitalSourceId: int("capitalSourceId").notNull(),
  awardAmount: int("awardAmount"),
  matchAmount: int("matchAmount"),
  administrativeCost: int("administrativeCost"),
  projectValueEnabled: int("projectValueEnabled"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerSourceUnique: uniqueIndex("roi_grant_return_owner_source_unique").on(table.ownerId, table.capitalSourceId),
}));

export const roiProjectCashFlows = mysqlTable("roi_project_cash_flows", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId").notNull(),
  monthIndex: int("monthIndex").notNull(),
  amount: int("amount").notNull(),
  flowType: mysqlEnum("flowType", ["forecast", "actual"]).notNull().default("forecast"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerProjectMonthFlowUnique: uniqueIndex("roi_cash_flow_owner_project_month_type_unique").on(table.ownerId, table.projectId, table.monthIndex, table.flowType),
}));

export const roiProjectScenarios = mysqlTable("roi_project_scenarios", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId").notNull(),
  scenarioName: varchar("scenarioName", { length: 128 }).notNull(),
  scenarioType: mysqlEnum("scenarioType", ["base", "upside", "downside", "custom"]).notNull().default("custom"),
  revenue: int("revenue"),
  cost: int("cost"),
  capitalRequired: int("capitalRequired"),
  periodMonths: int("periodMonths"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerProjectScenarioUnique: uniqueIndex("roi_scenario_owner_project_name_unique").on(table.ownerId, table.projectId, table.scenarioName),
}));

export const facilityJvDetails = mysqlTable("facility_jv_details", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  capitalOpportunityId: int("capitalOpportunityId").notNull(),
  partnerRole: varchar("partnerRole", { length: 255 }),
  facilityContribution: int("facilityContribution"),
  ceContribution: int("ceContribution"),
  facilityDescription: text("facilityDescription"),
  jvType: varchar("jvType", { length: 128 }),
  ownershipStructure: text("ownershipStructure"),
  proposedEconomics: text("proposedEconomics"),
  proposedTerms: text("proposedTerms"),
  operatorResponsibilities: text("operatorResponsibilities"),
  facilityLifecycle: varchar("facilityLifecycle", { length: 128 }),
  facilityPurpose: text("facilityPurpose"),
  capacity: varchar("capacity", { length: 255 }),
  equipmentIncluded: text("equipmentIncluded"),
  expansionPhase: varchar("expansionPhase", { length: 128 }),
  diligenceStatus: varchar("diligenceStatus", { length: 128 }),
  financialsReceived: boolean("financialsReceived").notNull().default(false),
  termSheetReceived: boolean("termSheetReceived").notNull().default(false),
  loiReceived: boolean("loiReceived").notNull().default(false),
  legalReviewed: boolean("legalReviewed").notNull().default(false),
  siteDocumentationReceived: boolean("siteDocumentationReceived").notNull().default(false),
  corporateDocumentationReceived: boolean("corporateDocumentationReceived").notNull().default(false),
  otherDiligenceRequirements: text("otherDiligenceRequirements"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerOpportunityUnique: uniqueIndex("facility_jv_owner_opportunity_unique").on(table.ownerId, table.capitalOpportunityId),
}));

export const equipmentFinanceDetails = mysqlTable("equipment_finance_details", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  capitalOpportunityId: int("capitalOpportunityId").notNull(),
  equipmentAsset: varchar("equipmentAsset", { length: 500 }),
  equipmentCategory: varchar("equipmentCategory", { length: 255 }),
  manufacturer: varchar("manufacturer", { length: 255 }),
  model: varchar("model", { length: 255 }),
  equipmentCondition: varchar("equipmentCondition", { length: 64 }),
  vendor: varchar("vendor", { length: 255 }),
  equipmentCost: int("equipmentCost"),
  quantity: int("quantity"),
  productionUse: text("productionUse"),
  expectedStartDate: timestamp("expectedStartDate"),
  usefulLifeMonths: int("usefulLifeMonths"),
  financingAmount: int("financingAmount"),
  downPayment: int("downPayment"),
  termMonths: int("termMonths"),
  rateBps: int("rateBps"),
  monthlyPayment: int("monthlyPayment"),
  residualBuyout: int("residualBuyout"),
  structure: mysqlEnum("structure", ["loan", "lease", "other"]),
  financingProgram: varchar("financingProgram", { length: 255 }),
  financierContactRole: varchar("financierContactRole", { length: 255 }),
  collateral: text("collateral"),
  approvalStatus: varchar("approvalStatus", { length: 128 }),
  diligenceStatus: varchar("diligenceStatus", { length: 128 }),
  termsState: mysqlEnum("termsState", ["missing", "estimated", "quoted", "approved", "actual"]).notNull().default("missing"),
  expectedUtilizationBps: int("expectedUtilizationBps"),
  incrementalProduction: text("incrementalProduction"),
  incrementalRevenue: int("incrementalRevenue"),
  operatingSavings: int("operatingSavings"),
  economicsPeriodMonths: int("economicsPeriodMonths"),
  financingCost: int("financingCost"),
  fundingDate: timestamp("fundingDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerOpportunityUnique: uniqueIndex("equipment_finance_owner_opportunity_unique").on(table.ownerId, table.capitalOpportunityId),
}));

export const grantDetails = mysqlTable("grant_details", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  capitalOpportunityId: int("capitalOpportunityId").notNull(),
  program: varchar("program", { length: 500 }),
  agency: varchar("agency", { length: 255 }),
  eligibility: text("eligibility"),
  awardCeiling: int("awardCeiling"),
  matchRequirement: text("matchRequirement"),
  applicationDeadline: timestamp("applicationDeadline"),
  eligibleCosts: text("eligibleCosts"),
  applicationStatus: varchar("applicationStatus", { length: 128 }),
  awardStatus: varchar("awardStatus", { length: 128 }),
  reportingRequirements: text("reportingRequirements"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerOpportunityUnique: uniqueIndex("grant_owner_opportunity_unique").on(table.ownerId, table.capitalOpportunityId),
}));

export const grantFundingPrograms = mysqlTable("grant_funding_programs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  programName: varchar("programName", { length: 500 }).notNull(),
  sponsor: varchar("sponsor", { length: 255 }).notNull(),
  mechanismType: mysqlEnum("mechanismType", ["grant", "tax_credit", "tax_abatement", "rebate", "loan", "forgivable_loan", "workforce_incentive", "infrastructure_incentive", "economic_development_incentive", "research_funding", "technical_assistance", "other"]).notNull(),
  governmentLevel: mysqlEnum("governmentLevel", ["federal", "state", "regional", "local", "utility", "strategic", "other"]).notNull(),
  texasRegion: varchar("texasRegion", { length: 255 }),
  industryFocus: text("industryFocus"),
  programDescription: text("programDescription"),
  programUrl: text("programUrl").notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  sourceLabel: varchar("sourceLabel", { length: 255 }).notNull(),
  researchDate: timestamp("researchDate").notNull(),
  applicationWindow: mysqlEnum("applicationWindow", ["open", "upcoming", "closed", "unknown"]).notNull().default("unknown"),
  applicationOpenAt: timestamp("applicationOpenAt"),
  applicationDeadline: timestamp("applicationDeadline"),
  expectedAwardAt: timestamp("expectedAwardAt"),
  awardMinimum: int("awardMinimum"),
  awardMaximum: int("awardMaximum"),
  typicalAward: int("typicalAward"),
  matchRequired: mysqlEnum("matchRequired", ["yes", "no", "unknown"]).notNull().default("unknown"),
  matchBps: int("matchBps"),
  fundingBps: int("fundingBps"),
  eligibleExpenses: text("eligibleExpenses"),
  companyEligibility: text("companyEligibility"),
  projectEligibility: text("projectEligibility"),
  geographicEligibility: text("geographicEligibility"),
  industryEligibility: text("industryEligibility"),
  requiredCertifications: text("requiredCertifications"),
  otherRequirements: text("otherRequirements"),
  ceEligibilityEvidence: boolean("ceEligibilityEvidence"),
  projectEligibilityEvidence: boolean("projectEligibilityEvidence"),
  geographicEligibilityEvidence: boolean("geographicEligibilityEvidence"),
  manufacturingRelevanceEvidence: boolean("manufacturingRelevanceEvidence"),
  roboticsAutomationRelevanceEvidence: boolean("roboticsAutomationRelevanceEvidence"),
  activeWindowEvidence: boolean("activeWindowEvidence"),
  strategicFitEvidence: boolean("strategicFitEvidence"),
  priority: mysqlEnum("priority", ["A", "B", "C"]).notNull().default("C"),
  priorityRationale: text("priorityRationale"),
  ceRelevance: text("ceRelevance"),
  status: mysqlEnum("status", ["research", "qualified", "passed"]).notNull().default("research"),
  nextAction: varchar("nextAction", { length: 500 }),
  nextActionDueAt: timestamp("nextActionDueAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerProgramUnique: uniqueIndex("grant_program_owner_name_unique").on(table.ownerId, table.programName) }));

export const grantFundingOpportunities = mysqlTable("grant_funding_opportunities", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  programId: int("programId").notNull(),
  capitalOpportunityId: int("capitalOpportunityId"),
  opportunityName: varchar("opportunityName", { length: 500 }).notNull(),
  linkedProject: varchar("linkedProject", { length: 255 }),
  linkedFacility: varchar("linkedFacility", { length: 255 }),
  linkedEquipment: varchar("linkedEquipment", { length: 500 }),
  linkedWorkforceInitiative: varchar("linkedWorkforceInitiative", { length: 500 }),
  linkedTechnology: varchar("linkedTechnology", { length: 500 }),
  ceStrategicThesis: text("ceStrategicThesis"),
  requestedAmount: int("requestedAmount"),
  proposedMatchAmount: int("proposedMatchAmount"),
  ownerName: varchar("ownerName", { length: 255 }),
  status: mysqlEnum("status", ["draft", "qualified", "passed", "application_started", "submitted", "under_review", "awarded", "declined", "closed"]).notNull().default("draft"),
  nextAction: varchar("nextAction", { length: 500 }),
  nextActionDueAt: timestamp("nextActionDueAt"),
  targetSubmissionAt: timestamp("targetSubmissionAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const grantFundingApplications = mysqlTable("grant_funding_applications", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  opportunityId: int("opportunityId").notNull(),
  applicationStatus: mysqlEnum("applicationStatus", ["not_started", "drafting", "submitted", "under_review", "awarded", "declined", "withdrawn", "closed"]).notNull().default("not_started"),
  requestedAmount: int("requestedAmount"),
  matchAmount: int("matchAmount"),
  submissionAt: timestamp("submissionAt"),
  decisionAt: timestamp("decisionAt"),
  applicationOwner: varchar("applicationOwner", { length: 255 }),
  submissionReference: varchar("submissionReference", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerOpportunityUnique: uniqueIndex("grant_application_owner_opportunity_unique").on(table.ownerId, table.opportunityId) }));

export const grantFundingAwards = mysqlTable("grant_funding_awards", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  applicationId: int("applicationId").notNull(),
  capitalOpportunityId: int("capitalOpportunityId"),
  awardStatus: mysqlEnum("awardStatus", ["pending", "awarded", "declined", "rescinded", "closed"]).notNull().default("pending"),
  awardAmount: int("awardAmount"),
  awardDate: timestamp("awardDate"),
  awardReference: varchar("awardReference", { length: 255 }),
  matchAmount: int("matchAmount"),
  awardDataState: mysqlEnum("awardDataState", ["actual", "projected", "estimated", "missing"]).notNull().default("missing"),
  reportingRequirementSummary: text("reportingRequirementSummary"),
  closeoutDate: timestamp("closeoutDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerApplicationUnique: uniqueIndex("grant_award_owner_application_unique").on(table.ownerId, table.applicationId) }));

export const grantAwardDisbursements = mysqlTable("grant_award_disbursements", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  awardId: int("awardId").notNull(),
  receivedAmount: int("receivedAmount").notNull(),
  receivedAt: timestamp("receivedAt").notNull(),
  reference: varchar("reference", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const grantComplianceItems = mysqlTable("grant_compliance_items", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  awardId: int("awardId").notNull(),
  requirementType: mysqlEnum("requirementType", ["reporting", "match", "milestone", "eligible_cost", "documentation", "workforce", "job_creation", "performance", "closeout", "other"]).notNull(),
  requirementDescription: text("requirementDescription").notNull(),
  dueAt: timestamp("dueAt"),
  ownerName: varchar("ownerName", { length: 255 }),
  status: mysqlEnum("status", ["not_started", "in_progress", "submitted", "complete", "overdue", "waived"]).notNull().default("not_started"),
  completedAt: timestamp("completedAt"),
  sourceReference: text("sourceReference"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const equipmentRentalVendors = mysqlTable("equipment_rental_vendors", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  organizationName: varchar("organizationName", { length: 255 }).notNull(),
  vendorType: varchar("vendorType", { length: 128 }).notNull(),
  equipmentCategories: text("equipmentCategories"),
  region: varchar("region", { length: 128 }).notNull(),
  city: varchar("city", { length: 128 }),
  serviceArea: text("serviceArea"),
  website: text("website"),
  contactName: varchar("contactName", { length: 255 }),
  contactTitle: varchar("contactTitle", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 64 }),
  equipmentFocus: text("equipmentFocus"),
  deliveryAvailable: mysqlEnum("deliveryAvailable", ["Yes", "No", "Unknown"]).notNull().default("Unknown"),
  pickupAvailable: mysqlEnum("pickupAvailable", ["Yes", "No", "Unknown"]).notNull().default("Unknown"),
  operatorServices: mysqlEnum("operatorServices", ["Yes", "No", "Unknown"]).notNull().default("Unknown"),
  shortTermRental: mysqlEnum("shortTermRental", ["Yes", "No", "Unknown"]).notNull().default("Unknown"),
  longTermRental: mysqlEnum("longTermRental", ["Yes", "No", "Unknown"]).notNull().default("Unknown"),
  newUsedSales: mysqlEnum("newUsedSales", ["Yes", "No", "Unknown"]).notNull().default("Unknown"),
  serviceMaintenance: mysqlEnum("serviceMaintenance", ["Yes", "No", "Unknown"]).notNull().default("Unknown"),
  strategicFit: mysqlEnum("strategicFit", ["High", "Medium", "Low"]).notNull().default("Low"),
  priority: mysqlEnum("priority", ["A", "B", "C"]).notNull().default("C"),
  priorityRationale: text("priorityRationale"),
  ceRelevance: text("ceRelevance"),
  source: varchar("source", { length: 255 }).notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  researchDate: timestamp("researchDate").notNull(),
  status: mysqlEnum("status", ["prospect", "research", "qualified", "passed"]).notNull().default("prospect"),
  nextAction: varchar("nextAction", { length: 500 }),
  nextActionDueAt: timestamp("nextActionDueAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerOrganizationUnique: uniqueIndex("equipment_rental_vendor_owner_org_unique").on(table.ownerId, table.organizationName),
}));

export const equipmentRentalRequirements = mysqlTable("equipment_rental_requirements", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId"),
  projectName: varchar("projectName", { length: 255 }),
  facilityName: varchar("facilityName", { length: 255 }),
  equipmentName: varchar("equipmentName", { length: 500 }).notNull(),
  equipmentCategory: varchar("equipmentCategory", { length: 255 }),
  quantity: int("quantity").notNull().default(1),
  productionUse: text("productionUse"),
  requiredStartDate: timestamp("requiredStartDate"),
  expectedEndDate: timestamp("expectedEndDate"),
  expectedUtilizationBps: int("expectedUtilizationBps"),
  status: mysqlEnum("status", ["draft", "sourcing", "quoting", "selected", "active", "completed", "cancelled"]).notNull().default("draft"),
  nextAction: varchar("nextAction", { length: 500 }),
  nextActionDueAt: timestamp("nextActionDueAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const equipmentRentalQuotes = mysqlTable("equipment_rental_quotes", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  requirementId: int("requirementId").notNull(),
  vendorId: int("vendorId").notNull(),
  quoteStatus: mysqlEnum("quoteStatus", ["requested", "received", "declined", "expired", "selected"]).notNull().default("requested"),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  rateUnit: mysqlEnum("rateUnit", ["daily", "weekly", "monthly", "project"]).notNull().default("monthly"),
  quotedRate: int("quotedRate"),
  deliveryFee: int("deliveryFee"),
  pickupFee: int("pickupFee"),
  estimatedTotal: int("estimatedTotal"),
  quoteValidUntil: timestamp("quoteValidUntil"),
  availabilityNote: text("availabilityNote"),
  serviceNote: text("serviceNote"),
  termsNotes: text("termsNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerRequirementVendorUnique: uniqueIndex("equipment_rental_quote_owner_requirement_vendor_unique").on(table.ownerId, table.requirementId, table.vendorId),
}));

export const equipmentActiveRentals = mysqlTable("equipment_active_rentals", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  requirementId: int("requirementId").notNull(),
  quoteId: int("quoteId"),
  vendorId: int("vendorId").notNull(),
  status: mysqlEnum("status", ["scheduled", "active", "return_due", "returned", "cancelled"]).notNull().default("scheduled"),
  scheduledStartDate: timestamp("scheduledStartDate"),
  scheduledEndDate: timestamp("scheduledEndDate"),
  actualStartDate: timestamp("actualStartDate"),
  actualReturnDate: timestamp("actualReturnDate"),
  actualRentalCost: int("actualRentalCost"),
  actualDeliveryFee: int("actualDeliveryFee"),
  actualPickupFee: int("actualPickupFee"),
  servicePerformanceNote: text("servicePerformanceNote"),
  returnConditionNote: text("returnConditionNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerRequirementUnique: uniqueIndex("equipment_active_rental_owner_requirement_unique").on(table.ownerId, table.requirementId),
}));

export const capitalOpportunityDocuments = mysqlTable("capital_opportunity_documents", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  capitalOpportunityId: int("capitalOpportunityId").notNull(),
  documentId: int("documentId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  ownerOpportunityDocumentUnique: uniqueIndex("capital_opportunity_document_owner_unique").on(table.ownerId, table.capitalOpportunityId, table.documentId),
}));

export const gmailConnections = mysqlTable("gmail_connections", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  refreshTokenEncrypted: text("refreshTokenEncrypted"),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
});

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  investorId: int("investorId"),
  campaignId: int("campaignId"),
  capitalOpportunityId: int("capitalOpportunityId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["open", "in_progress", "done", "snoozed"]).notNull().default("open"),
  dueAt: timestamp("dueAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const meetings = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  investorId: int("investorId"),
  campaignId: int("campaignId"),
  capitalOpportunityId: int("capitalOpportunityId"),
  title: varchar("title", { length: 255 }).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]).notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const outreachEvents = mysqlTable("outreach_events", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  contactId: int("contactId").notNull(),
  kind: varchar("kind", { length: 64 }).notNull(),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const investorResearchProposals = mysqlTable("investor_research_proposals", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  contactId: int("contactId").notNull(),
  status: mysqlEnum("status", ["proposed", "applied", "dismissed", "failed"]).notNull().default("proposed"),
  researchSummary: text("researchSummary"),
  thesis: text("thesis"),
  suggestedFitScore: int("suggestedFitScore"),
  geography: varchar("geography", { length: 128 }),
  checkSizeMin: int("checkSizeMin"),
  checkSizeMax: int("checkSizeMax"),
  investorLanguage: varchar("investorLanguage", { length: 255 }),
  portfolioHighlights: text("portfolioHighlights"),
  likelyObjections: text("likelyObjections"),
  bestPitchAngle: text("bestPitchAngle"),
  warmIntroPath: text("warmIntroPath"),
  assetClassPreference: varchar("assetClassPreference", { length: 255 }),
  riskTolerance: varchar("riskTolerance", { length: 128 }),
  returnExpectations: varchar("returnExpectations", { length: 255 }),
  capitalPreference: varchar("capitalPreference", { length: 128 }),
  investmentHorizon: varchar("investmentHorizon", { length: 128 }),
  decisionStructure: text("decisionStructure"),
  decisionCycle: varchar("decisionCycle", { length: 128 }),
  communicationPreference: varchar("communicationPreference", { length: 255 }),
  draftSubject: varchar("draftSubject", { length: 500 }),
  draftBody: text("draftBody"),
  fieldEvidence: text("fieldEvidence"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const investorResearchSources = mysqlTable("investor_research_sources", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  proposalId: int("proposalId").notNull(),
  url: text("url").notNull(),
  title: varchar("title", { length: 500 }),
  sourceType: varchar("sourceType", { length: 64 }).notNull().default("public website"),
  excerpt: text("excerpt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  contacts: many(investorContacts),
  campaigns: many(campaigns),
  tasks: many(tasks),
  meetings: many(meetings),
  events: many(outreachEvents),
  gmailConnections: many(gmailConnections),
}));

export const gmailConnectionsRelations = relations(gmailConnections, ({ one }) => ({
  owner: one(users, { fields: [gmailConnections.ownerId], references: [users.id] }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  owner: one(users, { fields: [campaigns.ownerId], references: [users.id] }),
  contacts: many(investorContacts),
  tasks: many(tasks),
  meetings: many(meetings),
}));

export const contactsRelations = relations(investorContacts, ({ one, many }) => ({
  owner: one(users, { fields: [investorContacts.ownerId], references: [users.id] }),
  campaign: one(campaigns, { fields: [investorContacts.campaignId], references: [campaigns.id] }),
  events: many(outreachEvents),
  tasks: many(tasks),
  meetings: many(meetings),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  owner: one(users, { fields: [tasks.ownerId], references: [users.id] }),
  investor: one(investorContacts, { fields: [tasks.investorId], references: [investorContacts.id] }),
  campaign: one(campaigns, { fields: [tasks.campaignId], references: [campaigns.id] }),
}));

export const meetingsRelations = relations(meetings, ({ one }) => ({
  owner: one(users, { fields: [meetings.ownerId], references: [users.id] }),
  investor: one(investorContacts, { fields: [meetings.investorId], references: [investorContacts.id] }),
  campaign: one(campaigns, { fields: [meetings.campaignId], references: [campaigns.id] }),
}));

export const eventsRelations = relations(outreachEvents, ({ one }) => ({
  owner: one(users, { fields: [outreachEvents.ownerId], references: [users.id] }),
  contact: one(investorContacts, { fields: [outreachEvents.contactId], references: [investorContacts.id] }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;
export type FundraisingDocument = typeof fundraisingDocuments.$inferSelect;
export type InsertFundraisingDocument = typeof fundraisingDocuments.$inferInsert;
export type CampaignDocument = typeof campaignDocuments.$inferSelect;
export type InvestorContact = typeof investorContacts.$inferSelect;
export type InsertInvestorContact = typeof investorContacts.$inferInsert;
export type CapitalBucket = typeof capitalBuckets.$inferSelect;
export type InsertCapitalBucket = typeof capitalBuckets.$inferInsert;
export type CapitalOpportunity = typeof capitalOpportunities.$inferSelect;
export type InsertCapitalOpportunity = typeof capitalOpportunities.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;
export type OutreachEvent = typeof outreachEvents.$inferSelect;
export type GmailConnection = typeof gmailConnections.$inferSelect;
