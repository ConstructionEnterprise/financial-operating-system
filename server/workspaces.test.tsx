import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CampaignsV2, MeetingsV2, TasksV2 } from "../client/src/App";

const noop = () => undefined;
const mutation = { isPending: false, mutate: noop };

describe("fundraising workspace controls", () => {
  it("renders campaign creation and funnel-stage controls", () => {
    const html = renderToStaticMarkup(<CampaignsV2 campaigns={[{ id: 1, name: "Pilot Campaign", groupName: "Priority outreach", sortOrder: 0, funnelStage: "50", targetCount: 50, status: "planning", createdAt: "2026-08-20T00:00:00.000Z" }]} contacts={[]} documents={[{ id: 9, name: "CEFF Deck.pdf", category: "Pitch deck", version: "v4", status: "current" }]} campaignDocumentLinks={[{ campaignId: 1, documentId: 9 }]} campaignName="" setCampaignName={noop} campaignStage="1,000" setCampaignStage={noop} campaignTarget="" setCampaignTarget={noop} campaignGroup="Priority outreach" setCampaignGroup={noop} campaignSort="custom" setCampaignSort={noop} campaignGroupFilter="all" setCampaignGroupFilter={noop} campaignStageFilter="all" setCampaignStageFilter={noop} campaignStatusFilter="all" setCampaignStatusFilter={noop} createCampaign={mutation} updateCampaign={mutation} deleteCampaign={mutation} linkDocument={mutation} unlinkDocument={mutation} />);
    expect(html).toContain("Campaign batches");
    expect(html).toContain("Create campaign");
    expect(html).toContain("1,000");
    expect(html).toContain("50");
    expect(html).toContain("Priority outreach");
    expect(html).toContain("Rename");
    expect(html).toContain("Group");
    expect(html).toContain("Move up");
    expect(html).toContain("Move down");
    expect(html).toContain("Delete");
    expect(html).toContain("CAMPAIGN MATERIALS");
    expect(html).toContain("CEFF Deck.pdf");
    expect(html).toContain("Unlink");
  });

  it("renders task creation with investor linkage and completion control", () => {
    const html = renderToStaticMarkup(<TasksV2 tasks={[{ id: 1, title: "Ask for warm intro", status: "open", investorId: 2, dueAt: "2026-08-21T00:00:00.000Z" }]} contacts={[{ id: 2, firmName: "Example Fund" }]} taskTitle="" setTaskTitle={noop} taskDue="" setTaskDue={noop} taskInvestor="" setTaskInvestor={noop} createTask={mutation} updateTask={mutation} />);
    expect(html).toContain("Link investor");
    expect(html).toContain("Ask for warm intro");
    expect(html).toContain("Mark done");
  });

  it("renders meeting creation with investor, campaign, and notes context", () => {
    const html = renderToStaticMarkup(<MeetingsV2 meetings={[]} contacts={[{ id: 2, firmName: "Example Fund" }]} campaigns={[{ id: 3, name: "Priority 50" }]} meetingTitle="" meetingDate="" meetingInvestor="" meetingCampaign="" meetingNotes="" setMeetingTitle={noop} setMeetingDate={noop} setMeetingInvestor={noop} setMeetingCampaign={noop} setMeetingNotes={noop} createMeeting={mutation} />);
    expect(html).toContain("Link investor");
    expect(html).toContain("Link campaign");
    expect(html).toContain("Meeting notes");
    expect(html).toContain("Schedule");
  });
});
