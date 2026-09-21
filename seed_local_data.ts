import { getDb, getWorkspaceUser, seedInitialInternalProjects, ensureCapitalBuckets, bootstrapEquityCapitalOpportunities } from "./server/db";

async function seedLocalData() {
  console.log("Starting local data seeding...");

  try {
    // Get the local workspace user
    const user = await getWorkspaceUser();
    if (!user) {
      throw new Error("No workspace user found. Run the app first to create the workspace user.");
    }
    console.log(`Using workspace user: ${user.name} (ID: ${user.id})`);

    // Seed internal projects
    console.log("Seeding internal projects...");
    const projectResult = await seedInitialInternalProjects(user.id);
    console.log(`✓ Projects seeded: ${JSON.stringify(projectResult, null, 2)}`);

    // Ensure capital buckets
    console.log("Ensuring capital buckets...");
    const buckets = await ensureCapitalBuckets(user.id);
    console.log(`✓ Capital buckets ready: ${buckets.length} buckets`);

    // Bootstrap capital formation
    console.log("Bootstrapping capital formation...");
    await bootstrapEquityCapitalOpportunities(user.id);
    console.log("✓ Capital formation bootstrapped");

    console.log("\n✅ Local data seeding completed successfully!");
    console.log("Refresh your browser to see the data.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedLocalData().then(() => process.exit(0));