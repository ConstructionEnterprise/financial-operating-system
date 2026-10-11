import "dotenv/config";
import { getWorkspaceUser, importTexasJvMasterUniverse } from "../server/db.ts";
import { scoreJvProspect } from "../shared/jvProspects.ts";
import { loadTexasJvMasterUniverse } from "../server/texasJvMasterUniverse.ts";

const owner = await getWorkspaceUser();
if (!owner) throw new Error("Owner workspace user not found. Database unavailable.");

const records = loadTexasJvMasterUniverse().map((record) => {
  const strategicFit = record.status === "prospect" ? "Medium" : "Low";
  const routing = scoreJvProspect({
    partnerType: record.partnerType,
    region: record.region,
    strategicFit,
    landContributionPotential: "Unknown",
    capitalContributionPotential: "Unknown",
    developmentContributionPotential: "Unknown",
    facilityContributionPotential: "Unknown",
  });
  return { ...record, strategicFit, priority: routing.priority, priorityRationale: routing.rationale };
});

const result = await importTexasJvMasterUniverse(owner.id, records);
console.log(JSON.stringify({ ownerId: owner.id, ...result }));
