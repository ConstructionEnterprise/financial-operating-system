import { describe, expect, it } from "vitest";
import { workspaceForSection, workspaceGroups, type Section } from "../client/src/lib/workspaceNavigation";

describe("consolidated FOS navigation", () => {
  const legacySections: Section[] = ["dashboard", "roi_returns", "internal_projects", "investors", "facility_jv", "equipment_finance", "grants", "campaigns", "documents", "inbox", "tasks", "meetings", "analytics", "settings", "integrations", "capital_viewer"];
  it("keeps every destination exactly once in ten workspaces", () => {
    const sections = workspaceGroups.flatMap(group => [...group.sections]);
    expect(workspaceGroups).toHaveLength(10);
    expect(sections).toHaveLength(16);
    expect(new Set(sections).size).toBe(16);
    expect([...sections].sort()).toEqual([...legacySections].sort());
  });
  it("resolves cross-workspace links without changing legacy section IDs", () => {
    for (const section of legacySections) {
      expect(workspaceForSection(section).sections).toContain(section);
    }
    expect(workspaceForSection("roi_returns").id).toBe("projects");
    expect(workspaceForSection("analytics").id).toBe("command");
    expect(workspaceForSection("meetings").id).toBe("actions");
  });
});
