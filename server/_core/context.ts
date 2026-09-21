import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getWorkspaceUser } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // FOS currently has no authentication requirement. Resolve a local workspace
  // actor solely to keep owner-scoped domain records and future authorization
  // boundaries intact.
  const user: User | null = (await getWorkspaceUser()) ?? null;

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
