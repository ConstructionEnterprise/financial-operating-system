import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerGmailRoutes } from "../gmail";
import { registerScheduledRoutes } from "../scheduled";
import { serveStatic, setupVite } from "./vite";
import { getWorkspaceUser, ensureCapitalBuckets, bootstrapEquityCapitalOpportunities } from "../db";
import { seedInitialInternalProjects } from "../internalProjects";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function seedLocalData() {
  try {
    console.log("Seeding local workspace data...");

    // Ensure workspace user exists (this creates it if needed)
    const user = await getWorkspaceUser();
    if (!user) {
      console.log("Failed to create workspace user - data seeding skipped");
      return;
    }

    console.log(`Workspace user: ${user.name} (ID: ${user.id})`);

    // Seed internal projects
    const projectResult = await seedInitialInternalProjects(user.id);
    console.log(`✓ Seeded ${projectResult.inserted} internal projects (skipped ${projectResult.skipped})`);

    // Ensure capital buckets
    const buckets = await ensureCapitalBuckets(user.id);
    console.log(`✓ Ready ${buckets.length} capital buckets`);

    // Bootstrap capital formation
    await bootstrapEquityCapitalOpportunities(user.id);
    console.log("✓ Bootstrapped capital formation");

    console.log("Local data seeding completed successfully");
  } catch (error) {
    console.error("Data seeding failed:", error);
    // Don't fail startup if seeding fails
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerGmailRoutes(app);
  registerScheduledRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

seedLocalData().then(() => startServer()).catch(console.error);
