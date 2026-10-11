import { useEffect, useRef, useState } from "react";
import { BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import { chicagoInput, meetingDay, monthDays, shiftMonth, weeklyMeetingCounts, type MeetingRecord } from "@shared/meetingWorkspace";
import { parseChicagoInput } from "@shared/meetingWorkspace";
import "./MeetingsWorkspace.css";

const palette = { scheduled: "#64899b", completed: "#496c54", cancelled: "#aa8165" };
const displayTime = (date: Date | string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(date));
type ContextProps = { contacts: { id: number; firmName: string }[]; campaigns: { id: number; name: string; internalProjectId?: number | null; financeType?: string | null }[]; opportunities: { id: number; organizationName: string; capitalPath: string }[]; projects: { id: number; projectName: string }[] };
const emptyDraft = { title: "", when: "", investorId: "", campaignId: "", capitalOpportunityId: "", status: "scheduled" as MeetingRecord["status"], notes: "" };

export function MeetingsWorkspace({ contacts, campaigns, opportunities, projects }: ContextProps) {
  const query = trpc.fundraising.meetings.useQuery();
  const utils = trpc.useUtils();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer); }, []);
  const [month, setMonth] = useState(() => meetingDay(new Date()).slice(0, 7));
  const [search, setSearch] = useState("");
  const [campaign, setCampaign] = useState("all");
  const [status, setStatus] = useState("all");
  const [mode, setMode] = useState("month");
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editor, setEditor] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState("");
  const editorRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (editor) editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [editor]);
  useEffect(() => { setPage(0); }, [month, search, campaign, status, mode, range]);
  const saved = async () => {
    setEditor(false); setMessage("Meeting saved in FOS. No invitations or external calendar changes were sent.");
    await Promise.all([utils.fundraising.meetings.invalidate(), utils.fundraising.analytics.invalidate()]);
  };
  const create = trpc.fundraising.createMeeting.useMutation({ onSuccess: saved, onError: e => setMessage(e.message) });
  const update = trpc.fundraising.updateMeeting.useMutation({ onSuccess: saved, onError: e => setMessage(e.message) });
  const pending = create.isPending || update.isPending;
  const rows: MeetingRecord[] = query.data ?? [];
  const campaignName = (id?: number | null) => campaigns.find(c => c.id === id)?.name ?? (id ? "Campaign unavailable" : "No campaign");
  const context = (m: MeetingRecord) => {
    const opp = opportunities.find(o => o.id === m.capitalOpportunityId);
    const investor = contacts.find(c => c.id === m.investorId);
    const c = campaigns.find(c => c.id === m.campaignId);
    const project = projects.find(p => p.id === c?.internalProjectId);
    return [opp?.organizationName, investor?.firmName, c?.name, project?.projectName].filter(Boolean).join(" · ") || "Internal / unlinked meeting";
  };
  const scoped = rows.filter(m => (campaign === "all" || String(m.campaignId ?? "none") === campaign) && `${m.title} ${m.notes ?? ""} ${context(m)}`.toLowerCase().includes(search.toLowerCase()));
  const monthRows = scoped.filter(m => meetingDay(m.scheduledAt).startsWith(month));
  const weekly = weeklyMeetingCounts(scoped, month);
  const groups = Array.from(new Set(monthRows.map(m => m.campaignId ?? 0))).map(id => ({ id, name: campaignName(id || null), count: monthRows.filter(m => (m.campaignId ?? 0) === id).length })).sort((a,b) => b.count-a.count);
  const review = scoped.filter(m => m.status === "scheduled" && new Date(m.scheduledAt) < now);
  const upcoming = scoped.filter(m => m.status === "scheduled" && new Date(m.scheduledAt) >= now);
  const queue = scoped.filter(m => {
    const day = meetingDay(m.scheduledAt);
    if (mode === "upcoming") return m.status === "scheduled" && new Date(m.scheduledAt) >= now;
    if (mode === "review") return m.status === "scheduled" && new Date(m.scheduledAt) < now;
    if (mode === "completed") return m.status === "completed";
    return day.startsWith(month) && (!range || day >= range.start && day <= range.end) && (status === "all" || m.status === status);
  }).sort((a,b) => mode === "completed" ? +new Date(b.scheduledAt)-+new Date(a.scheduledAt) : +new Date(a.scheduledAt)-+new Date(b.scheduledAt));
  const totalPages = Math.max(1, Math.ceil(queue.length / 5)), currentPage = Math.min(page,totalPages-1);
  const openNew = () => { setSelectedId(null); setDraft({ ...emptyDraft, when: range?.start ? `${range.start}T09:00` : "" }); setMessage(""); setEditor(true); };
  const openExisting = (m: MeetingRecord) => { setSelectedId(m.id); setDraft({ title: m.title, when: chicagoInput(m.scheduledAt), investorId: String(m.investorId ?? ""), campaignId: String(m.campaignId ?? ""), capitalOpportunityId: String(m.capitalOpportunityId ?? ""), status: m.status, notes: m.notes ?? "" }); setMessage(""); setEditor(true); editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); };
  if (query.isLoading) return <section className="meeting-hub">Loading meetings…</section>;
  if (query.error) return <section className="meeting-hub" role="alert">Meetings could not load: {query.error.message}<button onClick={() => query.refetch()}>Retry</button></section>;
  return <section className="meeting-hub" aria-label="Meetings command center">
    <header className="mh-heading"><div><div className="kicker">CONVERSATIONS → DECISIONS → FOLLOW-THROUGH</div><h2>Put the next decision on the calendar.</h2><p>Company, project, lender, investor and equipment conversations in one workspace.</p></div><button className="mh-primary" onClick={openNew}>+ Schedule meeting</button></header>
    <div className="mh-stats">{[["month", "This month", monthRows.length, "All recorded statuses"], ["upcoming", "Upcoming", upcoming.length, "Scheduled from now · all dates"], ["review", "Needs an outcome", review.length, "Past start time · still scheduled"], ["completed", "Completed", scoped.filter(m => m.status === "completed").length, "Recorded outcomes · all dates"]].map(([id,label,count,hint]) => <button key={id} aria-pressed={mode === id} className={mode === id ? "active" : ""} onClick={() => { setMode(String(id)); setRange(null); setStatus("all"); }}><span>{label}</span><strong>{count}</strong><small>{hint}</small></button>)}</div>
    <div className="mh-toolbar"><label>Search meetings<input placeholder="Title, notes, counterparty or project" value={search} onChange={e => setSearch(e.target.value)}/></label><label>Campaign<select value={campaign} onChange={e => setCampaign(e.target.value)}><option value="all">All campaigns</option><option value="none">Internal / no campaign</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button onClick={() => { setSearch(""); setCampaign("all"); setStatus("all"); setMode("month"); setRange(null); }}>Clear filters</button><small>All dates and times: America/Chicago (Central Time)</small></div>
    <div className="mh-visuals"><article className="mh-panel mh-calendar"><div className="mh-month"><button aria-label="Previous month" onClick={() => {setMonth(shiftMonth(month,-1)); setRange(null); setMode("month");}}>‹</button><h3>{new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-US", { month:"long",year:"numeric",timeZone:"UTC" })}</h3><button aria-label="Next month" onClick={() => {setMonth(shiftMonth(month,1)); setRange(null); setMode("month");}}>›</button><button onClick={() => {setMonth(meetingDay(now).slice(0,7)); setRange(null); setMode("month");}}>Today</button></div><div className="mh-weekdays">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <span key={d}>{d}</span>)}</div><div className="mh-days">{monthDays(month).map(day => {
      const meetings = scoped.filter(m => meetingDay(m.scheduledAt) === day);
      return <button key={day} className={`${day.startsWith(month) ? "" : "outside"} ${day === meetingDay(now) ? "today" : ""} ${range && day >= range.start && day <= range.end ? "selected" : ""}`} aria-label={`${day}, ${meetings.length} meetings`} aria-pressed={range?.start === day && range.end === day} onClick={() => {setMonth(day.slice(0,7)); setRange({start:day,end:day}); setMode("month"); setStatus("all");}}><b>{Number(day.slice(8))}</b>{meetings.length > 0 && <span>{meetings.length} <span className="mh-count-label">meeting{meetings.length !== 1 ? "s" : ""}</span></span>}<div className="mh-dots">{Object.entries(palette).map(([s,color]) => meetings.some(m => m.status === s) && <i key={s} style={{ background:color }}/>)}</div></button>;
    })}</div><div className="mh-key">{Object.entries(palette).map(([s,color]) => <span key={s}><i style={{background:color}}/>{s}</span>)}</div><small>Choose a date to filter the agenda. Calendar dots show recorded status, not attendance confirmation.</small></article>
      <div className="mh-chart-stack"><article className="mh-panel"><h3>Weekly meeting activity</h3><p>Selected month · click a status bar to inspect that week.</p><div className="mh-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekly} margin={{left:0,right:12,bottom:8}}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="label" tick={{fontSize:10}} interval={0}/><YAxis allowDecimals={false} width={28}/><Tooltip/><Legend/>{Object.entries(palette).map(([s,color]) => <Bar key={s} dataKey={s} name={s} fill={color} stackId="meetings" maxBarSize={32} onClick={(d: any) => {setRange({start:d.start,end:d.end}); setStatus(s);setMode("month");}}/>)}</BarChart></ResponsiveContainer></div>{!monthRows.length && <small>No meetings recorded for this month and filter.</small>}<label className="mh-week-select">Inspect week (keyboard alternative)<select value={range && range.start !== range.end ? range.start : ""} onChange={e => { const week = weekly.find(w => w.start === e.target.value); setRange(week ? {start:week.start,end:week.end} : null);setMode("month");}}><option value="">All weeks</option>{weekly.map(w => <option key={w.start} value={w.start}>{w.label}</option>)}</select></label></article>
      <article className="mh-panel"><h3>Campaign conversations</h3><p>Selected month · counts measure activity, not funding progress.</p>{groups.length ? <div className="mh-campaign-chart" style={{height:Math.max(130,groups.length*40)}}><ResponsiveContainer width="100%" height="100%"><BarChart data={groups} layout="vertical" margin={{right:20}}><CartesianGrid horizontal={false} strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={160} tick={{fontSize:11}} tickFormatter={v => v.length > 24 ? `${v.slice(0,23)}…` : v}/><Tooltip/><Bar dataKey="count" name="Meetings" fill="#a78b49" maxBarSize={26} onClick={(d: any) => {setCampaign(d.id ? String(d.id) : "none");setRange(null);setMode("month");}}/></BarChart></ResponsiveContainer></div> : <div className="mh-empty-chart">Link a scheduled meeting to a campaign to see its activity here. Internal meetings appear separately.</div>}</article></div>
    </div>
    <article className="mh-panel mh-agenda"><div className="mh-heading"><div><h3>{mode === "upcoming" ? "Upcoming timeline" : mode === "review" ? "Record the outcome" : mode === "completed" ? "Completed conversations" : "Meeting agenda"}</h3><p>{mode === "month" ? `${range ? `${range.start} through ${range.end}` : month} · ${status === "all" ? "all statuses" : status}` : "All dates"} · {queue.length} meetings matching filters</p></div>{mode === "month" && <label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option>{Object.keys(palette).map(s => <option key={s}>{s}</option>)}</select></label>}</div>
      {!queue.length ? <div className="mh-empty"><h4>{rows.length ? "No meetings match this view." : "Your meeting calendar is ready."}</h4><p>{rows.length ? "Choose another date or clear filters to explore saved meetings." : "Schedule the first lender review, project decision, investor conversation or equipment discussion. Nothing is scheduled automatically."}</p><button onClick={openNew}>Schedule a meeting</button></div> : queue.slice(currentPage*5,currentPage*5+5).map(m => <article key={m.id} className="mh-meeting" style={{borderLeftColor:palette[m.status]}}><div><time>{displayTime(m.scheduledAt)}</time><h4>{m.title}</h4><p>{context(m)}</p><small>{m.status === "scheduled" && new Date(m.scheduledAt)<now ? "Past start time — record an outcome or reschedule." : m.notes?.trim() ? "Agenda / notes recorded" : "Preparation needed — add agenda and desired decision."}</small></div><div><span className="mh-status">{m.status}</span><button onClick={() => openExisting(m)}>Open / edit</button></div></article>)}
      <div className="mh-pagination"><span>{queue.length ? currentPage*5+1 : 0}–{Math.min((currentPage+1)*5,queue.length)} of {queue.length}</span><button disabled={!currentPage} onClick={() => setPage(currentPage-1)}>Previous</button><span>Page {currentPage+1} of {totalPages}</span><button disabled={currentPage+1>=totalPages} onClick={() => setPage(currentPage+1)}>Next</button></div>
    </article>
    {editor && <form ref={editorRef} className="mh-panel mh-editor" onSubmit={e => {e.preventDefault(); try {const payload = {title:draft.title.trim(),scheduledAt:parseChicagoInput(draft.when),investorId:draft.investorId ? Number(draft.investorId) : null,campaignId:draft.campaignId ? Number(draft.campaignId) : null,capitalOpportunityId:draft.capitalOpportunityId ? Number(draft.capitalOpportunityId) : null,status:draft.status,notes:draft.notes}; if(selectedId) update.mutate({id:selectedId,...payload}); else create.mutate(payload);}catch(error){setMessage(error instanceof Error ? error.message : "Check the meeting date");}}}>
      <h3>{selectedId ? "Meeting details & outcome" : "Schedule a conversation"}</h3><p>Saved to FOS only. This does not send invitations or sync Google / Outlook calendars.</p><div className="mh-form-grid"><label>Meeting title<input required maxLength={255} value={draft.title} onChange={e => setDraft({...draft,title:e.target.value})} placeholder="e.g. Stonepine — construction debt review"/></label><label>Start date & time · Central Time<input required type="datetime-local" value={draft.when} onChange={e => setDraft({...draft,when:e.target.value})}/></label><label>Capital opportunity / counterparty<select value={draft.capitalOpportunityId} onChange={e => setDraft({...draft,capitalOpportunityId:e.target.value})}><option value="">Internal / no linked opportunity</option>{opportunities.map(o => <option key={o.id} value={o.id}>{o.organizationName} · {o.capitalPath}</option>)}</select></label><label>Investor contact (optional)<select value={draft.investorId} onChange={e => setDraft({...draft,investorId:e.target.value})}><option value="">No investor link</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.firmName}</option>)}</select></label><label>Campaign / project context<select value={draft.campaignId} onChange={e => setDraft({...draft,campaignId:e.target.value})}><option value="">Internal / no campaign</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}{c.internalProjectId ? ` · ${projects.find(p=>p.id===c.internalProjectId)?.projectName ?? "Project unavailable"}` : ""}</option>)}</select></label><label>Status<select value={draft.status} onChange={e => setDraft({...draft,status:e.target.value as MeetingRecord["status"]})}>{Object.keys(palette).map(s=><option key={s}>{s}</option>)}</select></label></div><label>Agenda, decisions & follow-up notes<textarea maxLength={10000} rows={6} value={draft.notes} onChange={e => setDraft({...draft,notes:e.target.value})} placeholder={"Purpose / decision needed:\nPreparation and documents:\nAttendees / location / call link:\nOutcome:\nNext action, responsible owner and due date:"}/></label><p className="mh-note">Record follow-up ownership and dates here; create actionable assignments in Tasks. Notes do not automatically create tasks.</p><button className="mh-primary" disabled={pending || !draft.title.trim()}>{pending ? "Saving…" : "Save meeting"}</button><button type="button" disabled={pending} onClick={()=>setEditor(false)}>Close without saving</button>
    </form>}
    {message && <p role="status" className="mh-message">{message}</p>}
  </section>;
}
