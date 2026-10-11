import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardCheck, Link2, ListTodo, Plus, Search } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dueBucketLabels, prioritizeTasks, summarizeTaskWorkspace, taskDueBucket, taskWorkstream, type TaskDueBucket, type TaskRecord, type TaskStatus } from "@shared/taskWorkspace";
import "./TasksWorkspace.css";

const statusLabel: Record<TaskStatus, string> = { open: "Open", in_progress: "In progress", snoozed: "Snoozed", done: "Done" };
const blankDraft = { title: "", description: "", due: "", status: "open" as TaskStatus, investorId: "", campaignId: "", capitalOpportunityId: "" };
const dateValue = (value?: Date | string | null) => value ? new Date(value).toISOString().slice(0, 10) : "";
const displayDate = (value?: Date | string | null) => value ? new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "No due date";

function TaskTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return <div className="tw-tooltip"><strong>{label}</strong>{payload.filter((item: any) => item.value).map((item: any) => <span key={item.dataKey} style={{ color: item.color }}>{item.name}: {item.value}</span>)}</div>;
}

export function TasksWorkspace({ tasks = [], contacts = [], campaigns = [], opportunities = [], createTask, updateTask }: any) {
  const now = new Date();
  const analytics = useMemo(() => summarizeTaskWorkspace(tasks, campaigns, opportunities, now), [tasks, campaigns, opportunities]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "active" | "all">("active");
  const [bucket, setBucket] = useState<TaskDueBucket | "all">("all");
  const [workstream, setWorkstream] = useState("all");
  const [page, setPage] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState(blankDraft);
  const [message, setMessage] = useState("");

  const investorName = (id?: number | null) => contacts.find((item: any) => item.id === id)?.firmName;
  const campaignName = (id?: number | null) => campaigns.find((item: any) => item.id === id)?.name;
  const opportunityName = (id?: number | null) => opportunities.find((item: any) => item.id === id)?.organizationName;
  const context = (task: TaskRecord) => [campaignName(task.campaignId), opportunityName(task.capitalOpportunityId), investorName(task.investorId)].filter(Boolean).join(" · ") || "Internal / no linked record";

  const filtered = prioritizeTasks(tasks, now).filter((task) => {
    const searchable = `${task.title} ${task.description ?? ""} ${context(task)} ${taskWorkstream(task, campaigns, opportunities)}`.toLowerCase();
    return searchable.includes(search.toLowerCase())
      && (status === "all" || status === "active" ? status === "all" || task.status !== "done" : task.status === status)
      && (bucket === "all" || taskDueBucket(task, now) === bucket)
      && (workstream === "all" || taskWorkstream(task, campaigns, opportunities) === workstream);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / 5));
  const currentPage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(currentPage * 5, currentPage * 5 + 5);
  const resetFilters = () => { setSearch(""); setStatus("active"); setBucket("all"); setWorkstream("all"); setPage(0); };
  const openNew = () => { setEditingId(null); setDraft(blankDraft); setMessage(""); setEditorOpen(true); };
  const openExisting = (task: TaskRecord) => { setEditingId(task.id); setDraft({ title: task.title, description: task.description ?? "", due: dateValue(task.dueAt), status: task.status, investorId: String(task.investorId ?? ""), campaignId: String(task.campaignId ?? ""), capitalOpportunityId: String(task.capitalOpportunityId ?? "") }); setMessage(""); setEditorOpen(true); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    const links = { investorId: draft.investorId ? Number(draft.investorId) : editingId ? null : undefined, campaignId: draft.campaignId ? Number(draft.campaignId) : editingId ? null : undefined, capitalOpportunityId: draft.capitalOpportunityId ? Number(draft.capitalOpportunityId) : editingId ? null : undefined };
    const payload = { title: draft.title.trim(), description: draft.description.trim() || (editingId ? null : undefined), status: draft.status, dueAt: draft.due ? new Date(`${draft.due}T12:00:00.000Z`) : editingId ? null : undefined, ...links };
    try {
      if (editingId) await updateTask.mutateAsync({ id: editingId, ...payload }); else await createTask.mutateAsync(payload);
      setMessage(editingId ? "Task updated in the operating record." : "Task added to the operating record.");
      setEditorOpen(false); setEditingId(null); setDraft(blankDraft);
    } catch (error: any) { setMessage(error?.message ?? "Task could not be saved."); }
  };
  const setQuickStatus = (task: TaskRecord, next: TaskStatus) => updateTask.mutate({ id: task.id, status: next });
  const applyStat = (nextStatus: TaskStatus | "active" | "all", nextBucket: TaskDueBucket | "all" = "all") => { setStatus(nextStatus); setBucket(nextBucket); setWorkstream("all"); setPage(0); };

  return <section className="task-hub" aria-label="Tasks command center">
    <header className="tw-heading"><div><div className="kicker">DECISIONS → OWNERSHIP → FOLLOW-THROUGH</div><h2>Put the capital plan into motion.</h2><p>Recorded work across investors, campaigns, capital opportunities and internal operations—without inventing activity.</p></div><button className="tw-primary" onClick={openNew}><Plus size={18}/> Record task</button></header>

    <div className="tw-stats">
      <button className={status === "active" && bucket === "all" ? "active" : ""} onClick={() => applyStat("active")}><ListTodo/><span>Active work</span><strong>{analytics.active}</strong><small>Open, underway or snoozed</small></button>
      <button className={bucket === "overdue" ? "active urgent" : "urgent"} onClick={() => applyStat("active", "overdue")}><AlertTriangle/><span>Overdue</span><strong>{analytics.overdue}</strong><small>Past due and not complete</small></button>
      <button className={["today", "next_7_days"].includes(bucket) ? "active" : ""} onClick={() => applyStat("active", "next_7_days")}><CalendarClock/><span>Due next 7 days</span><strong>{analytics.dueNext7}</strong><small>Today through the next week</small></button>
      <button className={status === "in_progress" ? "active" : ""} onClick={() => applyStat("in_progress")}><ClipboardCheck/><span>In progress</span><strong>{analytics.inProgress}</strong><small>Work explicitly underway</small></button>
      <button className={status === "done" ? "active" : ""} onClick={() => applyStat("done")}><CheckCircle2/><span>Completed</span><strong>{analytics.completed}</strong><small>Recorded closed work</small></button>
    </div>

    <div className="tw-visuals">
      <article className="tw-panel"><div className="tw-panel-head"><div><h3>Workload by due window</h3><p>Click a bar group to filter the action queue.</p></div><span>{analytics.noDueDate} active without a due date</span></div><div className="tw-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.due} margin={{ left: -12, right: 12, bottom: 8 }} onClick={(event: any) => { const id = event?.activePayload?.[0]?.payload?.id; if (id) { setBucket(id); setStatus("all"); setPage(0); } }}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="label" tick={{fontSize:11}} interval={0}/><YAxis allowDecimals={false}/><Tooltip content={<TaskTooltip/>}/><Legend/><Bar dataKey="open" name="Open" stackId="tasks" fill="#a78b49" maxBarSize={46}/><Bar dataKey="inProgress" name="In progress" stackId="tasks" fill="#668ba3"/><Bar dataKey="snoozed" name="Snoozed" stackId="tasks" fill="#8b7895"/><Bar dataKey="done" name="Done" stackId="tasks" fill="#4d7359"/></BarChart></ResponsiveContainer></div><label className="tw-chart-select">Keyboard filter<select value={bucket} onChange={(event) => { setBucket(event.target.value as TaskDueBucket | "all"); setPage(0); }}><option value="all">All due windows</option>{Object.entries(dueBucketLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></article>
      <article className="tw-panel"><div className="tw-panel-head"><div><h3>Work by capital workstream</h3><p>Active and completed tasks preserve their operating context.</p></div><span>{analytics.linked} of {analytics.total} linked</span></div>{analytics.workstreams.length ? <div className="tw-stream-chart" style={{ height: Math.max(230, analytics.workstreams.length * 44) }}><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.workstreams} layout="vertical" margin={{ left: 16, right: 20 }} onClick={(event: any) => { const name = event?.activePayload?.[0]?.payload?.name; if (name) { setWorkstream(name); setPage(0); } }}><CartesianGrid horizontal={false} strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={145} tick={{fontSize:11}} tickFormatter={(value) => value.length > 23 ? `${value.slice(0, 22)}…` : value}/><Tooltip content={<TaskTooltip/>}/><Legend/><Bar dataKey="active" name="Active" stackId="tasks" fill="#a78b49" maxBarSize={28}/><Bar dataKey="done" name="Done" stackId="tasks" fill="#4d7359"/></BarChart></ResponsiveContainer></div> : <div className="tw-empty">Record a task to begin the workstream view.</div>}<label className="tw-chart-select">Keyboard filter<select value={workstream} onChange={(event) => { setWorkstream(event.target.value); setPage(0); }}><option value="all">All workstreams</option>{analytics.workstreams.map((row) => <option key={row.name}>{row.name}</option>)}</select></label></article>
    </div>

    <article className="tw-panel tw-queue"><div className="tw-panel-head"><div><h3>Priority action queue</h3><p>Overdue and in-progress work rises first. Five records per page.</p></div><button onClick={resetFilters}>Clear filters</button></div>
      <div className="tw-toolbar"><label><Search size={16}/><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search task, investor, campaign or opportunity"/></label><select aria-label="Task status" value={status} onChange={(event) => { setStatus(event.target.value as any); setPage(0); }}><option value="active">Active work</option><option value="all">All statuses</option>{Object.entries(statusLabel).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select><span>{filtered.length} matching tasks</span></div>
      {!visible.length ? <div className="tw-empty"><CheckCircle2/><h4>No tasks match this view.</h4><p>Clear the filters or record the next accountable action.</p></div> : visible.map((task) => { const due = taskDueBucket(task, now); return <article className={`tw-task ${due === "overdue" ? "overdue" : ""}`} key={task.id}><div className="tw-task-date"><span>{dueBucketLabels[due]}</span><b>{displayDate(task.dueAt)}</b></div><div className="tw-task-main"><div><span className={`tw-status ${task.status}`}>{statusLabel[task.status]}</span><small>{taskWorkstream(task, campaigns, opportunities)}</small></div><h4>{task.title}</h4><p>{context(task)}</p>{task.description && <small>{task.description}</small>}</div><div className="tw-task-actions">{task.status !== "in_progress" && task.status !== "done" && <button onClick={() => setQuickStatus(task, "in_progress")}>Start</button>}{task.status !== "done" && <button className="complete" onClick={() => setQuickStatus(task, "done")}>Complete</button>}{task.status === "done" && <button onClick={() => setQuickStatus(task, "open")}>Reopen</button>}<button onClick={() => openExisting(task)}>Edit</button></div></article>; })}
      <div className="tw-pagination"><span>{filtered.length ? currentPage * 5 + 1 : 0}–{Math.min((currentPage + 1) * 5, filtered.length)} of {filtered.length}</span><button disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage + 1} of {totalPages}</span><button disabled={currentPage + 1 >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></div>
    </article>

    {editorOpen && <form className="tw-panel tw-editor" onSubmit={save}><div className="tw-panel-head"><div><div className="kicker">OPERATING RECORD</div><h3>{editingId ? "Edit accountable work" : "Record accountable work"}</h3><p>Link the task to the record it advances. Saving never sends a message or calendar invitation.</p></div><button type="button" onClick={() => setEditorOpen(false)}>Close</button></div><div className="tw-form-grid"><label className="wide">Task title *<input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })}/></label><label>Due date<input type="date" value={draft.due} onChange={(event) => setDraft({ ...draft, due: event.target.value })}/></label><label>Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as TaskStatus })}>{Object.entries(statusLabel).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Investor<select value={draft.investorId} onChange={(event) => setDraft({ ...draft, investorId: event.target.value })}><option value="">No investor</option>{contacts.map((item: any) => <option key={item.id} value={item.id}>{item.firmName}</option>)}</select></label><label>Campaign<select value={draft.campaignId} onChange={(event) => setDraft({ ...draft, campaignId: event.target.value })}><option value="">No campaign</option>{campaigns.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="wide">Capital opportunity<select value={draft.capitalOpportunityId} onChange={(event) => setDraft({ ...draft, capitalOpportunityId: event.target.value })}><option value="">No capital opportunity</option>{opportunities.map((item: any) => <option key={item.id} value={item.id}>{item.organizationName}{item.opportunityName ? ` — ${item.opportunityName}` : ""}</option>)}</select></label><label className="wide">Context / completion criteria<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })}/></label></div><div className="tw-editor-actions"><button className="tw-primary" disabled={createTask.isPending || updateTask.isPending}><Link2 size={16}/>{editingId ? "Save task changes" : "Create task"}</button><span>{message}</span></div></form>}
    {!editorOpen && message && <p className="tw-message" role="status">{message}</p>}
  </section>;
}
