import { describe, expect, it } from "vitest";
import { isAuthorizedFollowUpJob } from "./scheduled";

describe("scheduled follow-up authorization", () => {
  const secret = "a-long-random-scheduler-secret-for-tests";

  it("fails closed without a configured secret", () => {
    expect(isAuthorizedFollowUpJob(`Bearer ${secret}`, undefined)).toBe(false);
    expect(isAuthorizedFollowUpJob(`Bearer ${secret}`, "short")).toBe(false);
  });

  it("requires the exact bearer secret", () => {
    expect(isAuthorizedFollowUpJob(undefined, secret)).toBe(false);
    expect(isAuthorizedFollowUpJob(`Bearer ${secret}x`, secret)).toBe(false);
    expect(isAuthorizedFollowUpJob(`Bearer ${secret}`, secret)).toBe(true);
  });
});
