export type Section = "dashboard" | "roi_returns" | "internal_projects" | "investors" | "facility_jv" | "equipment_finance" | "grants" | "campaigns" | "documents" | "inbox" | "tasks" | "meetings" | "analytics" | "settings" | "integrations" | "capital_viewer";

export const workspaceGroups = [
  { id: "command", label: "Command Center", description: "Understand capital coverage, enterprise performance and management priorities.", sections: ["dashboard", "analytics"] },
  { id: "capital_viewer", label: "4D Capital Viewer", description: "Explore funding sources, destinations and uses across space, saved planning months and recorded dates.", sections: ["capital_viewer"] },
  { id: "projects", label: "Projects & Models", description: "Define project requirements, test economics and compare financial scenarios.", sections: ["internal_projects", "roi_returns"] },
  { id: "campaigns", label: "Capital Campaigns", description: "Structure company equity, project debt, JV, equipment and grant initiatives separately.", sections: ["campaigns"] },
  { id: "sources", label: "Capital Sources", description: "Qualify equity investors, project partners, equipment providers and grant programs. Project-debt underwriting lives in Capital Campaigns.", sections: ["investors", "facility_jv", "equipment_finance", "grants"] },
  { id: "actions", label: "Action Center", description: "Turn decisions into owned tasks, meetings and recorded follow-through.", sections: ["tasks", "meetings"] },
  { id: "communications", label: "Communications", description: "Review correspondence and manage approval-first outreach.", sections: ["inbox"] },
  { id: "records", label: "Records", description: "Maintain supporting documents and linked evidence.", sections: ["documents"] },
  { id: "integrations", label: "Integrations", description: "Inspect connected services and accounting connector setup requirements.", sections: ["integrations"] },
  { id: "settings", label: "Settings", description: "Manage workspace configuration.", sections: ["settings"] },
] as const satisfies ReadonlyArray<{ id: string; label: string; description: string; sections: readonly Section[] }>;

export function workspaceForSection(section: Section) {
  return workspaceGroups.find(group => (group.sections as readonly Section[]).includes(section))!;
}
