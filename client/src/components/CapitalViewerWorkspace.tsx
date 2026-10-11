import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { capitalCameraAt, screenDragToWorld, type SpatialOffset } from "../lib/capitalCamera";
import { campaignViewerRows, equipmentViewerRows, type ViewerRow } from "../lib/capitalViewerData";
import { capitalClusters, spaceClusterNodes } from "../lib/capitalClusters";
import { equipmentLineBudget, strategyLabels, type EquipmentPlanItem } from "../../../shared/equipmentPlan";
import { trpc } from "@/lib/trpc";
import { deploymentUseLabels, type DeploymentRow, type DeploymentUse } from "../../../shared/capitalDeployment";
import "./ConnectedWorkspaces.css";

type Measure = "planned" | "committed" | "paid";
type Allocation = { id: number; purpose: string; sourceOpportunityId: number | null; internalProjectId: number | null; category: string; plannedAmount: number; committedAmount: number | null; plannedMonth: string | null };
type Payment = { id: number; allocationId: number; amount: number; paidOn: string; voided: boolean };
type PortfolioProject = { projectId: number; projectName: string; primaryScenarioId: number | null; primaryScenarioName: string | null; developmentCost: number | null; scenarios: { scenarioId: number; capitalDeployment: { category: string; amount: number }[]; deploymentSeries: { monthIndex: number; constructionDeployment: number | null }[] }[] };
type TimedRow = ViewerRow & { period: string };
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const useName = (key: string) => deploymentUseLabels[key as DeploymentUse] ?? key.replaceAll("_", " ");
const modelCategory = (key: string) => ({ building: "construction", technology: "software", robotics_automation: "equipment", furniture_fixtures_equipment: "equipment", soft_costs: "professional_services" } as Record<string, string>)[key] ?? key;

export function CapitalViewerWorkspace({ opportunities, projects, storageScope }: { opportunities: any[]; projects: any[]; storageScope: number }) {
  const ledger = trpc.fundraising.capitalDeployment.useQuery(undefined);
  const portfolio = trpc.fundraising.financialOsPortfolioSnapshot.useQuery(undefined);
  const equipment = trpc.equipmentPlanning.list.useQuery(undefined);
  const campaigns = trpc.fundraising.campaigns.useQuery(undefined);
  const requirements = trpc.fundraising.equipmentRentalRequirements.useQuery(undefined);
  const rentals = trpc.fundraising.equipmentActiveRentals.useQuery(undefined);
  const [view, setView] = useState<"model" | "recorded" | "equipment" | "campaigns" | "rentals">("model");
  const [theme, setTheme] = useState<"green" | "light" | "space">(() => {
    try { const value = localStorage.getItem(`fos-capital-theme:${storageScope}`); return value === "light" || value === "space" ? value : "green"; } catch { return "green"; }
  });
  const [measure, setMeasure] = useState<Measure>("planned");
  const [timeIndex, setTimeIndex] = useState(-1);
  const [timeWindow, setTimeWindow] = useState<"period" | "through">("through");
  const [timePlaying, setTimePlaying] = useState(false);
  const [destination, setDestination] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [angle, setAngle] = useState(-12);
  const [tilt, setTilt] = useState(18);
  const [zoom, setZoom] = useState(1);
  const [flat, setFlat] = useState(false);
  const layoutKey = `fos-capital-layout-v1:${storageScope}`;
  const [offsets, setOffsets] = useState<Record<string, SpatialOffset>>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(layoutKey) ?? "{}");
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
      return Object.fromEntries(Object.entries(saved).filter(([, p]) => p && [p.x, p.y, p.z].every(v => typeof v === "number" && Number.isFinite(v))));
    } catch { return {}; }
  });
  const offsetRef = useRef(offsets);
  const drag = useRef<{ key: string; startX: number; startY: number; original: SpatialOffset; scale: number; angle: number; tilt: number; moved: boolean } | null>(null);
  const skipClick = useRef(false);
  const viewportLayout = useRef<HTMLDivElement>(null);
  const sceneElement = useRef<HTMLDivElement>(null);
  const [inspectorHidden, setInspectorHidden] = useState(() => {
    try { return localStorage.getItem(`fos-viewer-panel:${storageScope}`) !== "open"; } catch { return true; }
  });
  const fitTransform = useRef({ x: 500, y: 260, scale: 1 });
  const toggleInspector = () => setInspectorHidden(hidden => {
    try { localStorage.setItem(`fos-viewer-panel:${storageScope}`, hidden ? "open" : "closed"); } catch { /* Session preference still works. */ }
    return !hidden;
  });
  const [viewportWidth, setViewportWidth] = useState(71);
  const orbitDrag = useRef<{ x: number; y: number; angle: number; tilt: number } | null>(null);
  const resizeDrag = useRef<{ x: number; width: number; total: number } | null>(null);
  const [rotating, setRotating] = useState(false);
  const [layoutNotice, setLayoutNotice] = useState("");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const persistLayout = (value: Record<string, SpatialOffset>) => {
    try { localStorage.setItem(layoutKey, JSON.stringify(value)); setLayoutNotice("Layout saved on this device."); }
    catch { setLayoutNotice("Layout changed for this visit; browser storage is unavailable."); }
  };
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [playing, setPlaying] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [seconds, setSeconds] = useState(0);
  const elapsed = useRef(0);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => { setReducedMotion(preference.matches); if (preference.matches) setPlaying(false); };
    const updateVisibility = () => setVisible(!document.hidden);
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => { preference.removeEventListener("change", updatePreference); document.removeEventListener("visibilitychange", updateVisibility); };
  }, []);
  useEffect(() => {
    if (!playing || flat || !visible) return;
    let frame = 0, previous: number | null = null, rendered = 0;
    const animate = (now: number) => {
      if (previous !== null) elapsed.current += Math.min(now - previous, 100) / 1000;
      previous = now;
      // Limit React updates to ~30 fps and stop completely while paused/hidden.
      if (now - rendered >= 32) { setSeconds(elapsed.current); rendered = now; }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [playing, flat, visible]);
  const camera = capitalCameraAt(seconds);
  const zoomGestureState = useRef({ playing, flat, camera, zoom });
  zoomGestureState.current = { playing, flat, camera, zoom };
  useEffect(() => {
    const scene = sceneElement.current;
    if (!scene) return;
    const pinch = (event: WheelEvent) => {
      // Chromium/Windows trackpads report pinch as Ctrl+wheel. Ordinary two-finger
      // scrolling stays native, and browser zoom outside this scene is untouched.
      if (!event.ctrlKey || event.deltaY === 0) return;
      event.preventDefault();
      const current = zoomGestureState.current;
      const base = current.playing && !current.flat ? current.camera.zoom : current.zoom;
      if (current.playing && !current.flat) {
        setAngle(current.camera.angle); setTilt(current.camera.tilt);
        setPan({ x: current.camera.panX, y: current.camera.panY });
        setPlaying(false);
      }
      // Requested direction: fingers together (positive delta) zooms IN.
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
      const next = Math.max(.25, Math.min(3, base * Math.exp(Math.max(-100, Math.min(100, delta)) * .008)));
      zoomGestureState.current = { ...current, playing: false, zoom: next };
      setZoom(next);
    };
    scene.addEventListener("wheel", pinch, { passive: false });
    return () => scene.removeEventListener("wheel", pinch);
  }, []);
  // Freeze the cinematic pose on pause; manual controls then take over from it.
  const pauseCamera = () => { setAngle(camera.angle); setTilt(camera.tilt); setZoom(camera.zoom); setPan({ x: camera.panX, y: camera.panY }); setPlaying(false); };
  const inspectNode = (key: string) => {
    setSelected(selected === key ? null : key);
  };
  const startOrbit = (event: React.PointerEvent<SVGSVGElement>) => {
    if (flat || event.button !== 0 || (event.target as Element).closest(".capital-spatial-node")) return;
    event.preventDefault();
    orbitDrag.current = { x: event.clientX, y: event.clientY, angle: playing ? camera.angle : angle, tilt: playing ? camera.tilt : tilt };
    if (playing) pauseCamera();
    setRotating(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveOrbit = (event: React.PointerEvent<SVGSVGElement>) => {
    const start = orbitDrag.current; if (!start) return;
    setAngle(Math.max(-180, Math.min(180, start.angle + (event.clientX - start.x) * .3)));
    setTilt(Math.max(-75, Math.min(75, start.tilt - (event.clientY - start.y) * .3)));
  };
  const finishOrbit = (event: React.PointerEvent<SVGSVGElement>) => {
    orbitDrag.current = null; setRotating(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const clampWidth = (value: number) => Math.max(45, Math.min(85, value));
  const rows = useMemo<ViewerRow[]>(() => {
    if (view === "equipment") return equipmentViewerRows(equipment.data ?? []);
    if (view === "campaigns") return campaignViewerRows(campaigns.data ?? [], opportunities, projects);
    if (view === "rentals") {
      const rentalRecords: { id: number; requirementId: number; vendorId: number; status: string; actualRentalCost: number | null; actualDeliveryFee: number | null; actualPickupFee: number | null }[] = rentals.data ?? [];
      const needs: { id: number; equipmentName: string; projectId: number | null; projectName: string | null; facilityName: string | null; status: string }[] = requirements.data ?? [];
      return needs.map(need => {
        const rental = rentalRecords.find(r => r.requirementId === need.id);
        const costs = [rental?.actualRentalCost, rental?.actualDeliveryFee, rental?.actualPickupFee];
        return { id: `rental-${need.id}`, source: rental ? `Vendor #${rental.vendorId} · ${rental.status}` : `Rental requirement · ${need.status}`, destination: projects.find(p => p.id === need.projectId)?.projectName ?? need.projectName ?? need.facilityName ?? "Project unassigned", category: need.equipmentName, purpose: `${need.equipmentName} · ${rental ? `Rental #${rental.id}` : "No rental scheduled"}`, planned: costs.reduce<number>((sum, n) => sum + Number(n ?? 0), 0), unpriced: costs.some(n => n == null), committed: null, paid: 0, month: null };
      });
    }
    const allocations: Allocation[] = ledger.data?.allocations ?? [];
    const payments: Payment[] = ledger.data?.payments ?? [];
    const modelProjects: PortfolioProject[] = portfolio.data?.projects ?? [];
    if (view === "recorded") return allocations.map(a => ({ id: String(a.id), purpose: a.purpose, source: a.sourceOpportunityId === null ? "Unassigned funding" : opportunities.find(o => o.id === a.sourceOpportunityId)?.organizationName ?? `Source #${a.sourceOpportunityId}`, destination: a.internalProjectId === null ? "Company operations" : projects.find(p => p.id === a.internalProjectId)?.projectName ?? `Project #${a.internalProjectId}`, category: useName(a.category), planned: Number(a.plannedAmount), committed: a.committedAmount === null ? null : Number(a.committedAmount), paid: payments.filter(p => p.allocationId === a.id && !p.voided).reduce((sum, p) => sum + Number(p.amount), 0), month: a.plannedMonth } satisfies DeploymentRow));
    const result: DeploymentRow[] = [];
    for (const p of modelProjects) {
      const categories = p.scenarios.find(s => s.scenarioId === p.primaryScenarioId)?.capitalDeployment ?? [];
      for (const c of categories) result.push({ id: `model-${p.projectId}-${c.category}`, purpose: p.primaryScenarioName ?? "Planning model", source: "Funding not assigned in model", destination: p.projectName, category: useName(modelCategory(c.category)), planned: c.amount, committed: null, paid: 0, month: null });
      const remainder = (p.developmentCost ?? 0) - categories.reduce((sum, c) => sum + c.amount, 0);
      if (remainder > 0) result.push({ id: `model-${p.projectId}-remainder`, purpose: "Budget awaiting breakdown", source: "Funding not assigned in model", destination: p.projectName, category: "Budget awaiting breakdown", planned: remainder, committed: null, paid: 0, month: null });
    }
    return result;
  }, [view, ledger.data, portfolio.data, opportunities, projects, equipment.data, campaigns.data, requirements.data, rentals.data]);
  const effectiveMeasure = view === "recorded" || view === "campaigns" ? measure : "planned";
  const timedRows = useMemo<TimedRow[]>(() => {
    if (view === "model") return ((portfolio.data?.projects ?? []) as PortfolioProject[]).flatMap(project => {
      const scenario = project.scenarios.find(item => item.scenarioId === project.primaryScenarioId);
      return (scenario?.deploymentSeries ?? []).filter(item => item.constructionDeployment !== null && item.monthIndex > 0).map(item => ({
        id: `model-month-${project.projectId}-${item.monthIndex}`, purpose: `${scenario?.scenarioId === project.primaryScenarioId ? project.primaryScenarioName ?? "Planning model" : "Planning model"} · month ${item.monthIndex}`,
        source: "Funding not assigned in model", destination: project.projectName, category: "Scheduled development deployment",
        planned: Number(item.constructionDeployment), committed: null, paid: 0, month: `M${item.monthIndex}`, period: String(item.monthIndex),
      }));
    });
    if (view === "equipment") return (equipment.data ?? []).flatMap((plan: { id: number; projectName: string; plan: { items: EquipmentPlanItem[] } }) => plan.plan.items.flatMap(item => {
      const total = equipmentLineBudget(item);
      const months = item.strategy === "rent" ? Array.from({ length: item.endMonth - item.startMonth + 1 }, (_, index) => item.startMonth + index) : [item.startMonth];
      return months.map(month => ({ id: `equipment-month-${plan.id}-${item.key}-${month}`, purpose: `${item.quantity} × ${item.name} · M${month} · ${item.basis}`,
        source: strategyLabels[item.strategy], destination: plan.projectName, category: item.name,
        planned: item.strategy === "rent" ? item.quantity * Number(item.unitMonthlyRent ?? 0) : Number(total ?? 0),
        unpriced: total === null, committed: null, paid: 0, month: `M${month}`, period: String(month),
      }));
    }));
    if (view === "recorded") {
      if (effectiveMeasure === "paid") return ((ledger.data?.payments ?? []) as Payment[]).filter(payment => !payment.voided && /^\d{4}-\d{2}-\d{2}$/.test(payment.paidOn)).flatMap(payment => {
        const allocation = rows.find(row => row.id === String(payment.allocationId));
        return allocation ? [{ ...allocation, id: `payment-${payment.id}`, purpose: `${allocation.purpose} · payment ${payment.id}`, planned: 0, committed: null, paid: Number(payment.amount), month: payment.paidOn, period: payment.paidOn.slice(0, 7) }] : [];
      });
      return rows.filter(row => /^\d{4}-\d{2}$/.test(row.month ?? "")).map(row => ({ ...row, period: row.month! }));
    }
    return [];
  }, [view, effectiveMeasure, portfolio.data, equipment.data, ledger.data, rows]);
  const periods = useMemo(() => {
    const dated = Array.from(new Set(timedRows.map(row => row.period)));
    if (view === "model" || view === "equipment") {
      const lastMonth = Math.max(0, ...dated.map(Number).filter(Number.isFinite));
      return Array.from({ length: lastMonth }, (_, index) => String(index + 1));
    }
    return dated.sort((left, right) => left.localeCompare(right));
  }, [timedRows, view]);
  const selectedPeriod = timeIndex < 0 ? null : periods[Math.min(timeIndex, periods.length - 1)] ?? null;
  useEffect(() => { setTimeIndex(-1); setTimePlaying(false); }, [view, effectiveMeasure]);
  useEffect(() => {
    if (!timePlaying || !periods.length) return;
    const timer = window.setInterval(() => setTimeIndex(previous => previous < 0 ? 0 : Math.min(previous + 1, periods.length - 1)), 850);
    return () => window.clearInterval(timer);
  }, [timePlaying, periods.length]);
  useEffect(() => { if (timePlaying && timeIndex >= periods.length - 1) setTimePlaying(false); }, [timePlaying, timeIndex, periods.length]);
  const spatialRows = useMemo(() => rows.filter(r => (destination === "all" || r.destination === destination) && `${r.source} ${r.destination} ${r.category} ${r.purpose}`.toLowerCase().includes(search.toLowerCase())), [rows, destination, search]);
  const datedRows = useMemo(() => timedRows.filter(r => (destination === "all" || r.destination === destination) && `${r.source} ${r.destination} ${r.category} ${r.purpose}`.toLowerCase().includes(search.toLowerCase())), [timedRows, destination, search]);
  const filtered = useMemo(() => selectedPeriod === null ? spatialRows : datedRows.filter(row => timeWindow === "period" ? row.period === selectedPeriod : view === "model" || view === "equipment" ? Number(row.period) <= Number(selectedPeriod) : row.period <= selectedPeriod), [spatialRows, datedRows, selectedPeriod, timeWindow, view]);
  // The relationship network never changes its layout as time advances.
  const groupKeys = useMemo(() => Array.from(new Set(spatialRows.map(row => `cluster:${JSON.stringify([row.destination, row.source])}`))), [spatialRows]);
  const expandedGroups = useMemo(() => new Set(groupKeys.filter(key => !collapsedGroups.has(key))), [groupKeys, collapsedGroups]);
  const graph = useMemo(() => capitalClusters(spatialRows, effectiveMeasure, expandedGroups), [spatialRows, effectiveMeasure, expandedGroups]);
  const activeGraph = useMemo(() => capitalClusters(filtered, effectiveMeasure, expandedGroups), [filtered, effectiveMeasure, expandedGroups]);
  const activeNodes = useMemo(() => new Map(activeGraph.nodes.map(node => [node.key, node])), [activeGraph]);
  const activeLinks = useMemo(() => new Map(activeGraph.links.map(link => [`${activeGraph.nodes[link.source].key}→${activeGraph.nodes[link.target].key}`, link.value])), [activeGraph]);
  const nodeKey = (n: typeof graph.nodes[number]) => n.key;
  const world = useMemo(() => spaceClusterNodes(graph.nodes, offsets), [graph, offsets]);
  const centerX = world.length ? (Math.min(...world.map(p => p.x)) + Math.max(...world.map(p => p.x))) / 2 : 0;
  const centerY = world.length ? (Math.min(...world.map(p => p.y)) + Math.max(...world.map(p => p.y))) / 2 : 0;
  const focalLength = 4000;
  const projectPosition = (position: SpatialOffset) => {
    const x = position.x - centerX, y = position.y - centerY, z = flat ? 0 : position.z;
    const yaw = (flat ? 0 : playing ? camera.angle : angle) * Math.PI / 180, pitch = (flat ? 0 : playing ? camera.tilt : tilt) * Math.PI / 180;
    const rx = x * Math.cos(yaw) + z * Math.sin(yaw), rz = -x * Math.sin(yaw) + z * Math.cos(yaw);
    const ry = y * Math.cos(pitch) - rz * Math.sin(pitch), depth = y * Math.sin(pitch) + rz * Math.cos(pitch);
    const scale = focalLength / Math.max(100, focalLength + depth);
    return { x: 500 + rx * scale, y: 260 + ry * scale, depth, scale };
  };
  const points = world.map(projectPosition);
  const projectTrails = graph.nodes.flatMap((node, index) => {
    if (node.dimension !== "destination" || periods.length === 0) return [];
    const projectRows = datedRows.filter(row => row.destination === node.project);
    if (!projectRows.length) return [];
    const anchor = world[index];
    const events = periods.map((period, periodIndex) => {
      const records = projectRows.filter(row => row.period === period);
      const amount = records.reduce((sum, row) => sum + Number(row[effectiveMeasure] ?? 0), 0);
      const progress = periods.length === 1 ? .5 : periodIndex / (periods.length - 1);
      return { period, periodIndex, amount, count: records.length,
        point: projectPosition({ x: anchor.x + 105 + progress * 560, y: anchor.y + 150, z: anchor.z - 105 + progress * 210 }) };
    });
    return [{ project: node.project, hub: points[index], events }];
  });
  // Fit the complete projected model, including labels, into a fixed viewport.
  // Zoom is applied AFTER spacing, so neither labels nor gaps resist zooming out.
  if (!drag.current && points.length) {
    const timePoints = projectTrails.flatMap(trail => trail.events.map(event => event.point));
    const left = Math.min(...points.map(p => p.x - 18 * p.scale), ...timePoints.map(p => p.x - 20));
    const right = Math.max(...points.map(p => p.x + 390), ...timePoints.map(p => p.x + 45));
    const top = Math.min(...points.map(p => p.y - 18 * p.scale), ...timePoints.map(p => p.y - 22));
    const bottom = Math.max(...points.map(p => p.y + 60 * p.scale), ...timePoints.map(p => p.y + 46));
    fitTransform.current = { x: (left + right) / 2, y: (top + bottom) / 2, scale: Math.min(920 / Math.max(1, right - left), 440 / Math.max(1, bottom - top)) };
  }
  const fitted = fitTransform.current;
  const displayScale = fitted.scale * (playing && !flat ? camera.zoom : zoom);
  const pointerPosition = (event: React.PointerEvent<SVGGElement>) => {
    const svg = event.currentTarget.ownerSVGElement!;
    const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM()!.inverse());
  };
  const beginDrag = (event: React.PointerEvent<SVGGElement>, key: string, scale: number) => {
    if (event.button !== 0) return;
    const pointer = pointerPosition(event);
    const index = graph.nodes.findIndex(node => node.key === key);
    const placed = world[index], anchor = graph.nodes[index].position;
    drag.current = { key, startX: pointer.x, startY: pointer.y, original: { x: placed.x - anchor.x, y: placed.y - anchor.y, z: placed.z - anchor.z }, scale, angle: flat ? 0 : playing ? camera.angle : angle, tilt: flat ? 0 : playing ? camera.tilt : tilt, moved: false };
    skipClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: React.PointerEvent<SVGGElement>) => {
    const active = drag.current; if (!active) return;
    const pointer = pointerPosition(event), dx = pointer.x - active.startX, dy = pointer.y - active.startY;
    if (!active.moved && Math.hypot(dx, dy) < 4) return;
    if (!active.moved && playing) { pauseCamera(); active.angle = flat ? 0 : camera.angle; active.tilt = flat ? 0 : camera.tilt; }
    active.moved = true;
    const delta = screenDragToWorld(dx, dy, active.scale, active.angle, active.tilt);
    const next = { ...offsetRef.current, [active.key]: { x: active.original.x + delta.x, y: active.original.y + delta.y, z: active.original.z + delta.z } };
    offsetRef.current = next; setOffsets(next);
  };
  const finishDrag = (event: React.PointerEvent<SVGGElement>) => {
    if (!drag.current) return;
    skipClick.current = drag.current.moved;
    if (drag.current.moved) persistLayout(offsetRef.current);
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const inspected = graph.nodes.find(n => nodeKey(n) === selected);
  const previewNode = graph.nodes.find(n => n.key === hoveredNode);
  const related = inspected ? filtered.filter(r => inspected.dimension === "destination" ? r.destination === inspected.project : inspected.dimension === "source" ? r.destination === inspected.project && r.source === inspected.name : inspected.recordIds.includes(r.id) || (selectedPeriod !== null && r.destination === inspected.project && r.category === inspected.name)) : filtered;
  const total = filtered.reduce((sum, r) => sum + (r[effectiveMeasure] ?? 0), 0);
  const activeQuery = view === "model" ? portfolio : view === "equipment" ? equipment : view === "campaigns" ? campaigns : view === "rentals" ? requirements : ledger;
  const error = activeQuery.error || (view === "rentals" ? rentals.error : null);
  const loading = activeQuery.isLoading || (view === "rentals" && rentals.isLoading);
  const columns = view === "campaigns" ? ["Financing instrument", "Campaign", "Recipient / project"] : view === "equipment" ? ["Acquisition strategy", "Project", "Equipment"] : view === "rentals" ? ["Rental / vendor", "Project", "Equipment"] : ["Funding source", "Project / company", "Use of capital"];
  const measureLabel = view === "campaigns" ? ({ planned: "Campaign targets", committed: "Capital committed", paid: "Funding received" }[effectiveMeasure]) : view === "equipment" ? "Equipment planning allowances" : view === "rentals" ? "Recorded rental costs (including partial records)" : view === "model" ? "Modeled project budgets" : effectiveMeasure === "paid" ? "Recorded payments" : `${effectiveMeasure} expense allocations`;
  const periodTotals = periods.map(period => timedRows.filter(row => row.period === period && (destination === "all" || row.destination === destination) && `${row.source} ${row.destination} ${row.category} ${row.purpose}`.toLowerCase().includes(search.toLowerCase())).reduce((sum, row) => sum + Number(row[effectiveMeasure] ?? 0), 0));
  const maxPeriodTotal = Math.max(1, ...periodTotals);
  const periodLabel = (period: string) => view === "model" || view === "equipment" ? `Month ${period}` : period;
  const timeBasis = view === "model" ? "Estimated monthly development schedule; category timing is not inferred from the aggregate budget." : view === "equipment" ? "Saved equipment-plan months; rental allowances recur monthly, while finance allowances appear at their planned start." : view === "recorded" ? effectiveMeasure === "paid" ? "Actual payment dates, grouped by calendar month." : "Recorded planned allocation months; commitment dates are not independently recorded." : "No dated capital events are recorded for this evidence view. Its relationships remain visible in All records.";
  const colors = { source: "#73b897", destination: "#dab365", category: "#7caed0" };
  return <section className="connected-workspace">
    <label className="viewer-search">Find a project, campaign or equipment item<input value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }} placeholder="Search this evidence view" /></label>
    <div className="viewer-controls"><label>Evidence view<select value={view} onChange={e => { setView(e.target.value as typeof view); setSelected(null); setDestination("all"); }}><option value="model">Modeled project budgets</option><option value="recorded">Recorded allocations & payments</option><option value="equipment">Equipment finance & rental plans</option><option value="rentals">Rental operations</option><option value="campaigns">Capital campaigns</option></select></label><label>Measure<select value={effectiveMeasure} disabled={view !== "recorded" && view !== "campaigns"} onChange={e => { setMeasure(e.target.value as Measure); setSelected(null); }}><option value="planned">{view === "campaigns" ? "Campaign targets" : "Planned / recorded scope"}</option><option value="committed">{view === "campaigns" ? "Capital committed" : "Committed expenses"}</option><option value="paid">{view === "campaigns" ? "Funding received" : "Recorded payments"}</option></select></label><label>{view === "campaigns" ? "Campaign" : "Destination"}<select value={destination} onChange={e => { setDestination(e.target.value); setSelected(null); }}><option value="all">{view === "campaigns" ? "All campaigns" : "All destinations"}</option>{Array.from(new Set(rows.map(r => r.destination))).map(name => <option key={name}>{name}</option>)}</select></label><button disabled={flat} onClick={() => { if (playing) pauseCamera(); else { setSelected(null); setPlaying(true); } }}>{playing && !flat ? "Pause motion" : "Play motion"}</button><button onClick={() => { if (playing) pauseCamera(); setFlat(!flat); }}>{flat ? "Switch to 3D" : "Switch to 2D"}</button><button onClick={() => { elapsed.current = 0; setSeconds(0); setAngle(-12); setTilt(18); setZoom(1); setPan({ x: 0, y: 0 }); setSelected(null); }}>Reset camera</button><button onClick={() => { offsetRef.current = {}; setOffsets({}); persistLayout({}); }}>Reset node layout</button></div>
    <div className="viewer-themes" role="group" aria-label="Viewer background">{(["light", "space", "green"] as const).map(choice => <button key={choice} aria-pressed={theme === choice} onClick={() => { setTheme(choice); try { localStorage.setItem(`fos-capital-theme:${storageScope}`, choice); } catch { /* Theme remains available for this visit. */ } }}><i className={`theme-swatch swatch-${choice}`} />{choice[0].toUpperCase() + choice.slice(1)}</button>)}</div>
    <div className="viewer-summary"><strong>{money(total)}</strong><span>{measureLabel} · {selectedPeriod === null ? "All records" : `${timeWindow === "through" ? "Cumulative through" : "During"} ${periodLabel(selectedPeriod)}`} · Counted once across all columns · {filtered.length} records{filtered.some(r => r.unpriced) && " · Includes records with missing amounts"}</span></div>
    <div className="viewer-motion-status"><span className={playing && !flat ? "motion-live" : ""}>{playing && !flat ? "Cinematic tour · orbit, tilt and drift" : flat ? "2D inspection" : "Camera paused · drag a node or inspect records"}</span><small>Drag nodes to arrange your space. Positions are saved per user on this device. {reducedMotion ? "Reduced-motion preference honored; play is optional." : "Selecting keeps the tour moving. Dragging pauses for precise placement."}</small></div><small role="status">{layoutNotice}</small>
    <p className="viewer-gesture-help">Left-click and hold empty space to rotate. Drag a node to move it. Drag the right-edge grab bar to widen the viewport. Pinch inward to zoom in; pinch outward to zoom out. Manual rotation or zoom pauses the tour; Play motion resumes it.</p>
    <div className="viewer-local-toolbar"><button onClick={() => { setCollapsedGroups(previous => previous.size ? new Set() : new Set(groupKeys)); setSelected(null); }}>{collapsedGroups.size ? "Show all records" : "Collapse clusters"}</button><button onClick={() => { if (playing) pauseCamera(); setZoom(1); }}>Fit entire model</button><button className="viewer-panel-toggle" aria-expanded={!inspectorHidden} aria-controls="capital-viewer-inspector" onClick={toggleInspector}>{inspectorHidden ? "Show details panel" : "Hide details panel"}</button></div>
    <div ref={viewportLayout} className={`viewer-layout${inspectorHidden ? " viewer-inspector-hidden" : ""}`} style={{ "--viewport-share": `${viewportWidth}fr`, "--inspector-share": `${100 - viewportWidth}fr` } as CSSProperties}><div><div ref={sceneElement} className={`capital-spatial-scene viewer-theme-${theme}`}>
      <div className="viewer-column-labels"><span>Funding relationships</span><span>Project hubs</span><span>Dated capital events →</span></div>
      <p className="viewer-evidence-note">Global graph: every record is visible from the start. Hover to read a dense node; select it to inspect records. Faint dotted cross-links mean shared categories, not transfers. Dated markers follow each project's time trajectory.</p>
      <div className="viewer-node-preview" role="status">{previewNode ? <><strong>{previewNode.name}</strong><span>{previewNode.project} · {previewNode.recordIds.length} record{previewNode.recordIds.length === 1 ? "" : "s"} · {money(previewNode.amount)}{previewNode.unknown ? ` · ${previewNode.unknown} unpriced` : ""}</span></> : <span>Hover any node for a quick read; click only when you want its underlying records.</span>}</div>
{error ? <p role="alert">Capital records could not be loaded. {error.message}</p> : loading ? <p role="status">Loading capital records…</p> : !graph.nodes.length ? <p>No records in this view. Choose another evidence view or add records in its workspace.</p> : <svg viewBox="0 0 1000 520" role="group" aria-label="Interactive spatial capital graph with dated project trajectories" className={flat ? "" : rotating ? "viewport-rotating" : "viewport-rotatable"} onPointerDown={startOrbit} onPointerMove={moveOrbit} onPointerUp={finishOrbit} onPointerCancel={finishOrbit} onLostPointerCapture={() => { orbitDrag.current = null; setRotating(false); }}>
        <g transform={`translate(500 260) scale(${displayScale}) translate(${-fitted.x} ${-fitted.y})`}>
        {graph.links.map((link, i) => {
          const from = points[link.source], to = points[link.target];
          const sourceNode = graph.nodes[link.source], targetNode = graph.nodes[link.target];
          const currentValue = activeLinks.get(`${sourceNode.key}→${targetNode.key}`) ?? 0;
          const highlighted = !inspected || (inspected.dimension === "destination" ? sourceNode.project === inspected.project : sourceNode.key === selected || targetNode.key === selected);
          const semantic = link.kind === "shared-category";
          const visible = semantic || selectedPeriod === null || activeLinks.has(`${sourceNode.key}→${targetNode.key}`);
          return <path key={`${sourceNode.key}→${targetNode.key}`} d={`M ${from.x} ${from.y} C ${(from.x + to.x) / 2} ${from.y}, ${(from.x + to.x) / 2} ${to.y}, ${to.x} ${to.y}`} fill="none" stroke={semantic ? "var(--viewer-semantic-link)" : "var(--viewer-link)"} strokeDasharray={semantic ? "2 7" : currentValue === 0 ? "5 5" : undefined} strokeOpacity={semantic ? .22 : visible ? highlighted ? .62 : .14 : .055} strokeWidth={semantic ? 1.4 : Math.max(1, total ? 36 * currentValue / total : 1)} className="viewer-timelapse-link"><title>{semantic ? `Shared category: ${sourceNode.name}. Semantic relationship only; no capital flow implied.` : `${sourceNode.name} → ${targetNode.name}: ${visible ? money(currentValue) : "Outside selected time window"}`}</title></path>;
        })}
        {projectTrails.map(trail => {
          const first = trail.events[0]?.point, last = trail.events[trail.events.length - 1]?.point;
          if (!first || !last) return null;
          const cursor = timeIndex < 0 ? null : trail.events[Math.min(timeIndex, trail.events.length - 1)];
          const selectedProject = selected === `destination:${trail.project}`;
          return <g key={`trajectory:${trail.project}`} className="viewer-temporal-trajectory" opacity={inspected?.dimension === "destination" && !selectedProject ? .2 : 1}>
            <path d={`M ${trail.hub.x} ${trail.hub.y} C ${trail.hub.x + 45} ${trail.hub.y + 55}, ${first.x - 35} ${first.y}, ${first.x} ${first.y}`} fill="none" stroke="var(--viewer-link)" strokeOpacity=".48" strokeWidth="2" strokeDasharray="5 4" />
            <path d={trail.events.map((event, index) => `${index ? "L" : "M"} ${event.point.x} ${event.point.y}`).join(" ")} fill="none" stroke="var(--viewer-link)" strokeOpacity=".42" strokeWidth="3" />
            {cursor && <><path d={trail.events.slice(0, timeIndex + 1).map((event, index) => `${index ? "L" : "M"} ${event.point.x} ${event.point.y}`).join(" ")} fill="none" stroke="#f0c96c" strokeOpacity=".85" strokeWidth="4" className="viewer-timelapse-link"/><circle cx={cursor.point.x} cy={cursor.point.y} r="19" fill="none" stroke="#f0c96c" strokeWidth="2" className="viewer-temporal-playhead"/></>}
            {trail.events.filter(event => event.count > 0).map(event => {
              const active = timeIndex < 0 || (timeWindow === "through" ? event.periodIndex <= timeIndex : event.periodIndex === timeIndex);
              const atPlayhead = event.periodIndex === timeIndex;
              const radius = Math.max(4 / displayScale, 4 + Math.min(9, 9 * Math.sqrt(event.amount / maxPeriodTotal)));
              return <g key={event.period} role="button" tabIndex={0} className="capital-spatial-node viewer-temporal-event" aria-label={`${trail.project}, ${periodLabel(event.period)}, ${money(event.amount)}; inspect this period`} aria-pressed={atPlayhead}
                onClick={() => { setTimePlaying(false); setTimeIndex(event.periodIndex); setSelected(`destination:${trail.project}`); }}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTimePlaying(false); setTimeIndex(event.periodIndex); setSelected(`destination:${trail.project}`); } }}
                opacity={active ? 1 : .22}>
                <title>{trail.project} · {periodLabel(event.period)} · {event.count} records · {money(event.amount)}</title>
                <circle cx={event.point.x} cy={event.point.y} r={radius} fill={atPlayhead ? "#f0c96c" : "#7ecbb5"} stroke="var(--viewer-outline)" strokeWidth="1.5" />
              </g>;
            })}
            <text x={first.x} y={first.y + 31} fill="var(--viewer-text)" fontSize="15">{periodLabel(trail.events[0].period)}</text>
            <text x={last.x - 15} y={last.y + 31} fill="var(--viewer-text)" fontSize="15">{periodLabel(trail.events[trail.events.length - 1].period)}</text>
          </g>;
        })}
        {graph.nodes.map((node, index) => ({ node, point: points[index] })).sort((a, b) => b.point.depth - a.point.depth).map(({ node, point }) => {
          const current = activeNodes.get(node.key);
          const visible = selectedPeriod === null || Boolean(current);
          const subdued = inspected?.dimension === "destination" && node.project !== inspected.project;
          const showLabel = node.dimension !== "category" || graph.nodes.length <= 40 || selected === node.key || hoveredNode === node.key;
          const labelSize = Math.max(node.dimension === "category" ? 18 : 22, (node.dimension === "category" ? 10 : 12) / displayScale);
          const labelOffset = Math.max(26, 15 / displayScale);
          return <g key={node.key} role="button" tabIndex={0} aria-label={`Inspect ${node.name}${visible ? "" : ", outside selected time window"}`} aria-pressed={selected === node.key}
            onPointerDown={e => beginDrag(e, node.key, point.scale * displayScale)} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag}
            onPointerEnter={() => setHoveredNode(node.key)} onPointerLeave={() => setHoveredNode(null)} onFocus={() => setHoveredNode(node.key)} onBlur={() => setHoveredNode(null)}
            onClick={() => { if (skipClick.current) { skipClick.current = false; return; } inspectNode(node.key); }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inspectNode(node.key); } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) { e.preventDefault(); if (playing) pauseCamera(); const delta = screenDragToWorld(e.key === "ArrowLeft" ? -10 : e.key === "ArrowRight" ? 10 : 0, e.key === "ArrowUp" ? -10 : e.key === "ArrowDown" ? 10 : 0, point.scale * displayScale, flat ? 0 : playing ? camera.angle : angle, flat ? 0 : playing ? camera.tilt : tilt); const previous = offsetRef.current[node.key] ?? { x: 0, y: 0, z: 0 }; const next = { ...offsetRef.current, [node.key]: { x: previous.x + delta.x, y: previous.y + delta.y, z: previous.z + delta.z } }; offsetRef.current = next; setOffsets(next); persistLayout(next); } }}
            opacity={subdued ? .18 : visible ? 1 : .2} aria-expanded={node.expandable ? node.expanded : undefined} className="capital-spatial-node viewer-timelapse-node">
            <title>{node.name} · {visible ? `${current?.recordIds.length ?? 0} active records · ${money(current?.amount ?? 0)} known` : "Outside selected time window"}{current?.unknown ? ` · ${current.unknown} unpriced` : ""} · Select to inspect; drag to reposition</title>
            <circle cx={point.x} cy={point.y} r={Math.max(6 / displayScale, (node.dimension === "destination" ? 20 : node.expandable ? 15 : 9) * point.scale)} fill={colors[node.dimension]} stroke={selected === node.key ? "var(--viewer-selected)" : "var(--viewer-outline)"} strokeWidth={Math.max(2, 2 / displayScale)}/>
            {showLabel && <text x={point.x + labelOffset} y={point.y + 4} fill="var(--viewer-text)" fontSize={labelSize}>{node.name.length > 29 ? `${node.name.slice(0, 27)}…` : node.name}</text>}
            {node.dimension !== "category" && <text x={point.x + labelOffset} y={point.y + Math.max(30, 17 / displayScale)} fill="var(--viewer-text)" fontSize={Math.max(18, 10 / displayScale)}>{visible ? `${current?.recordIds.length ?? 0} records · ${money(current?.amount ?? 0)}${current?.unknown ? ` · ${current.unknown} unpriced` : ""}` : "Later / outside window"}</text>}
          </g>;
        })}
        </g>
      </svg>}
      <section className="viewer-time viewer-time-in-scene" aria-label="Spatial timelapse controls">
        <div className="viewer-time-heading">
          <div><span className="viewer-time-kicker">SPATIAL TIMELAPSE</span><h3>{selectedPeriod === null ? "All records" : `${timeWindow === "through" ? "Through" : "During"} ${periodLabel(selectedPeriod)}`}</h3></div>
          <div className="viewer-time-actions">
            <button type="button" aria-pressed={selectedPeriod === null} onClick={() => { setTimePlaying(false); setTimeIndex(-1); }}>All records</button>
            <button type="button" disabled={!periods.length} onClick={() => { if (timePlaying) setTimePlaying(false); else { if (timeIndex >= periods.length - 1) setTimeIndex(-1); if (!flat && !reducedMotion) setPlaying(true); setTimePlaying(true); } }}>{timePlaying ? "Pause timelapse" : "Play spatial timelapse"}</button>
            <select aria-label="Time window" value={timeWindow} disabled={!periods.length} onChange={event => setTimeWindow(event.target.value as "period" | "through")}><option value="through">Cumulative through playhead</option><option value="period">At playhead only</option></select>
          </div>
        </div>
        {periods.length > 0 ? <div className="viewer-time-slider"><span>{periodLabel(periods[0])}</span><input type="range" aria-label="Capital time position" min="0" max={periods.length - 1} value={Math.max(0, timeIndex)} onChange={event => { setTimePlaying(false); setTimeIndex(Number(event.target.value)); }} /><span>{periodLabel(periods[periods.length - 1])}</span></div> : <p className="viewer-time-empty">No dated records in this view. Undated relationships remain explorable above.</p>}
        <small>{timeBasis} Dated events are drawn on each project's trajectory; undated records are never assigned an invented month.</small>
      </section>
    </div><details className="viewer-manual-camera"><summary>Manual camera controls</summary><div className="viewer-camera"><label>Orbit<input aria-label="Camera orbit" type="range" min="-180" max="180" value={angle} disabled={flat || playing} onChange={e => setAngle(Number(e.target.value))}/></label><label>Tilt<input aria-label="Camera tilt" type="range" min="-75" max="75" value={tilt} disabled={flat || playing} onChange={e => setTilt(Number(e.target.value))}/></label><label>Zoom<input aria-label="Camera zoom" type="range" min="0.25" max="3" step="0.05" value={zoom} disabled={playing && !flat} onChange={e => setZoom(Number(e.target.value))}/></label></div></details></div>
    <div className="viewer-resize-handle" role="separator" tabIndex={0} aria-label="Resize capital viewport" aria-orientation="vertical" aria-valuemin={45} aria-valuemax={85} aria-valuenow={Math.round(viewportWidth)} title="Drag right to widen viewport; arrow keys resize; Home resets" onPointerDown={event => {
      if (event.button !== 0) return;
      event.preventDefault();
      resizeDrag.current = { x: event.clientX, width: viewportWidth, total: Math.max(1, (viewportLayout.current?.getBoundingClientRect().width ?? 1) - 20) };
      event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => { const start = resizeDrag.current; if (start) setViewportWidth(clampWidth(start.width + (event.clientX - start.x) / start.total * 100)); }} onPointerUp={event => { resizeDrag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { resizeDrag.current = null; }} onLostPointerCapture={() => { resizeDrag.current = null; }} onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      setViewportWidth(value => event.key === "Home" ? 71 : event.key === "End" ? 85 : clampWidth(value + (event.key === "ArrowRight" ? 2 : -2)));
    }}><span /></div>
    <aside id="capital-viewer-inspector" hidden={inspectorHidden} className="connector-card viewer-inspector"><h3>{inspected?.name ?? "Explore the relationships"}</h3>{inspected && <button onClick={() => { setDestination(inspected.project); setSelected(null); setZoom(1); }}>Focus this project / campaign</button>}{inspected?.expandable && <button onClick={() => setCollapsedGroups(previous => { const next = new Set(previous); if (next.has(inspected.key)) next.delete(inspected.key); else next.add(inspected.key); return next; })}>{collapsedGroups.has(inspected.key) ? "Show records in this cluster" : "Collapse this cluster"}</button>}<p>Select a relationship or a dated marker on a project trajectory. Link width and marker size represent recorded or modeled dollars; trajectory position represents time.</p><strong>{money(related.reduce((sum, r) => sum + (r[effectiveMeasure] ?? 0), 0))}</strong><div className="viewer-records">{related.map(r => <article key={r.id}><b>{r.purpose}</b><span>{r.source} → {r.destination} → {r.category}</span><strong>{r.unpriced && effectiveMeasure === "planned" ? (view === "rentals" ? `Incomplete · ${money(r.planned)} recorded` : "Amount not recorded") : money(r[effectiveMeasure] ?? 0)}</strong><small>Record {r.id}{r.month ? ` · ${r.month}` : ""}</small></article>)}</div></aside></div>
    <details className="connector-card"><summary>Accessible relationship ledger · {filtered.length} records</summary><div className="viewer-table"><table><thead><tr>{columns.map(label => <th key={label}>{label}</th>)}<th>{measureLabel}</th></tr></thead><tbody>{filtered.map(r => <tr key={r.id}><td>{r.source}</td><td>{r.destination}</td><td>{r.category}</td><td>{r.unpriced && effectiveMeasure === "planned" ? (view === "rentals" ? `Incomplete · ${money(r.planned)} recorded` : "Amount not recorded") : money(r[effectiveMeasure] ?? 0)}</td></tr>)}</tbody></table></div></details>
  </section>;
}
