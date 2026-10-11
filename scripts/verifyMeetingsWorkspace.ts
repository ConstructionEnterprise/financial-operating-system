import assert from "node:assert/strict";
import { chicagoInput, parseChicagoInput, meetingDay, monthDays, shiftMonth, weeklyMeetingCounts, type MeetingRecord } from "../shared/meetingWorkspace.ts";
assert.equal(parseChicagoInput("2026-10-07T09:30").toISOString(), "2026-10-07T14:30:00.000Z");
assert.equal(parseChicagoInput("2026-12-07T09:30").toISOString(), "2026-12-07T15:30:00.000Z");
assert.equal(chicagoInput("2026-10-08T02:00:00Z"), "2026-10-07T21:00");
assert.equal(meetingDay("2026-10-08T02:00:00Z"), "2026-10-07");
assert.throws(() => parseChicagoInput("2026-03-08T02:30"));
assert.throws(() => parseChicagoInput("2026-11-01T01:30"));
assert.throws(() => parseChicagoInput("2026-02-30T10:00"));
assert.throws(() => parseChicagoInput(""));
assert.equal(monthDays("2026-10").length,42);
assert.equal(monthDays("2026-10")[0],"2026-09-27");
assert.equal(shiftMonth("2026-12",1),"2027-01");
assert.equal(shiftMonth("2026-01",-1),"2025-12");
const rows: MeetingRecord[] = [
  {id:1,title:"Test only",scheduledAt:"2026-10-08T02:00:00Z",status:"scheduled"},
  {id:2,title:"Test only",scheduledAt:"2026-10-09T14:00:00Z",status:"completed"},
  {id:3,title:"Test only",scheduledAt:"2026-10-09T16:00:00Z",status:"cancelled"},
  {id:4,title:"Excluded September",scheduledAt:"2026-09-30T14:00:00Z",status:"scheduled"},
];
const weeks = weeklyMeetingCounts(rows,"2026-10");
assert.equal(weeks.reduce((s,w)=>s+w.scheduled+w.completed+w.cancelled,0),3);
assert.equal(weeks[1].scheduled,1);
assert.equal(weeks[1].completed,1);
assert.equal(weeks[1].cancelled,1);
assert.equal(weeklyMeetingCounts([],"2026-10").every(w=>w.scheduled+w.completed+w.cancelled===0),true);
console.log("Meetings checks passed: Central Time, day boundaries, DST guards, month navigation, week/status totals and empty data. No database writes.");
