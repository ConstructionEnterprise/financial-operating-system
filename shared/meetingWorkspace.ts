export const meetingZone = "America/Chicago";
export type MeetingRecord = { id: number; title: string; scheduledAt: Date | string; status: "scheduled" | "completed" | "cancelled"; notes?: string | null; investorId?: number | null; campaignId?: number | null; capitalOpportunityId?: number | null };
export function chicagoInput(date: Date | string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: meetingZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(date));
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export const meetingDay = (date: Date | string) => chicagoInput(date).slice(0, 10);
export function parseChicagoInput(value: string) {
  if (!/^20\d\d-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Enter a valid Central Time date and time (2000–2099).");
  const nominal = Date.parse(`${value}:00Z`);
  const matches = [5, 6].map(offset => new Date(nominal + offset * 3600000)).filter(d => Number.isFinite(d.getTime()) && chicagoInput(d) === value);
  if (matches.length !== 1) throw new Error("This Central Time is invalid or ambiguous at a daylight-saving change. Choose an unambiguous time.");
  return matches[0];
}
export function monthDays(month: string) {
  const start = new Date(`${month}-01T12:00:00Z`);
  const offset = start.getUTCDay();
  return Array.from({ length: 42 }, (_, i) => new Date(start.getTime() + (i - offset) * 86400000).toISOString().slice(0, 10));
}
export function shiftMonth(month: string, delta: number) {
  const d = new Date(`${month}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + delta); return d.toISOString().slice(0, 7);
}
export function weeklyMeetingCounts(rows: MeetingRecord[], month: string) {
  const days = monthDays(month);
  return Array.from({ length: 6 }, (_, i) => {
    const start = days[i * 7], end = days[i * 7 + 6];
    const found = rows.filter(r => { const day = meetingDay(r.scheduledAt); return day >= start && day <= end && day.startsWith(month); });
    return { start, end, label: `${start.slice(5)}–${end.slice(5)}`, scheduled: found.filter(r => r.status === "scheduled").length, completed: found.filter(r => r.status === "completed").length, cancelled: found.filter(r => r.status === "cancelled").length };
  });
}
