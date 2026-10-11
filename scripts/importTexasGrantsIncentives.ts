import "dotenv/config";
import { getWorkspaceUser, importTexasGrantsIncentivesMasterUniverse } from "../server/db.ts";
import { loadTexasGrantsIncentivesMasterUniverse } from "../server/texasGrantsIncentivesMasterUniverse.ts";

const owner = await getWorkspaceUser();
if (!owner) throw new Error("Owner workspace user not found. Database unavailable.");

const records = loadTexasGrantsIncentivesMasterUniverse();
const result = await importTexasGrantsIncentivesMasterUniverse(owner.id, records);
console.log(JSON.stringify({ ownerId: owner.id, ...result }));
process.exit(0);
