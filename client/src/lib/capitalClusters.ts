import type { ViewerRow } from "./capitalViewerData";
import type { SpatialOffset } from "./capitalCamera";

type Dimension = "source" | "destination" | "category";
export type ClusterNode = {
  key: string; name: string; dimension: Dimension; project: string;
  recordIds: string[]; amount: number; unknown: number;
  expandable: boolean; expanded: boolean; position: SpatialOffset;
};
export function capitalClusters(rows: ViewerRow[], measure: "planned" | "committed" | "paid", expanded: ReadonlySet<string>) {
  const nodes: ClusterNode[] = [];
  const links: { source: number; target: number; value: number; kind?: "shared-category" }[] = [];
  const destinations = Array.from(new Set(rows.map(r => r.destination))).sort();
  const columns = Math.max(1, Math.ceil(Math.sqrt(destinations.length)));
  const add = (key: string, name: string, dimension: Dimension, project: string, records: ViewerRow[], position: SpatialOffset, expandable = false) => {
    nodes.push({ key, name, dimension, project, recordIds: records.map(r => r.id),
      amount: records.reduce((sum, r) => sum + (r[measure] ?? 0), 0),
      unknown: records.filter(r => r.unpriced && measure === "planned").length,
      expandable, expanded: expanded.has(key), position });
    return nodes.length - 1;
  };
  destinations.forEach((project, projectIndex) => {
    const records = rows.filter(r => r.destination === project);
    const center = { x: (projectIndex % columns) * 1100, y: Math.floor(projectIndex / columns) * 1000, z: 0 };
    const hub = add(`destination:${project}`, project, "destination", project, records, center);
    const strategies = Array.from(new Set(records.map(r => r.source))).sort();
    strategies.forEach((strategy, groupIndex) => {
      const members = records.filter(r => r.source === strategy);
      const theta = -Math.PI / 2 + projectIndex * 2.399963229728653 + groupIndex * 2 * Math.PI / strategies.length;
      const key = `cluster:${JSON.stringify([project, strategy])}`;
      const group = add(key, strategy, "source", project, members,
        { x: center.x + Math.cos(theta) * 210, y: center.y + Math.sin(theta) * 210, z: 35 }, true);
      links.push({ source: hub, target: group, value: nodes[group].amount });
      if (!expanded.has(key)) return;
      members.forEach((record, index) => {
        // A deterministic phyllotactic cloud reads like a knowledge graph and
        // keeps every record visible without imposing a long spoke hierarchy.
        const leafAngle = theta + index * 2.399963229728653;
        const radius = 130 + 68 * Math.sqrt(index);
        const leaf = add(`record:${record.id}`, record.category, "category", project, [record],
          { x: nodes[group].position.x + Math.cos(leafAngle) * radius, y: nodes[group].position.y + Math.sin(leafAngle) * radius, z: (index % 5 - 2) * 27 });
        links.push({ source: group, target: leaf, value: nodes[leaf].amount });
      });
    });
  });
  // A shared use/category is a discoverable relationship, never a cash flow.
  const categories = new Map<string, number[]>();
  nodes.forEach((node, index) => { if (node.dimension === "category") categories.set(node.name, [...(categories.get(node.name) ?? []), index]); });
  categories.forEach((indexes: number[]) => {
    indexes.sort((a, b) => nodes[a].project.localeCompare(nodes[b].project));
    for (let i = 1; i < indexes.length; i++) if (nodes[indexes[i - 1]].project !== nodes[indexes[i]].project) {
      links.push({ source: indexes[i - 1], target: indexes[i], value: 0, kind: "shared-category" });
    }
  });
  return { nodes, links };
}

// Deterministic label-aware repulsion around stable anchors. Pinned user nodes
// influence their neighbors but are never moved by the relaxation pass.
export function spaceClusterNodes(nodes: ClusterNode[], offsets: Record<string, SpatialOffset>) {
  const positions = nodes.map(node => {
    const offset = offsets[node.key] ?? offsets[`${node.dimension}:${node.name}`];
    return { x: node.position.x + (offset?.x ?? 0), y: node.position.y + (offset?.y ?? 0), z: node.position.z + (offset?.z ?? 0), pinned: Boolean(offset) };
  });
  const dense = nodes.length > 40;
  const footprint = (node: ClusterNode) => node.dimension === "category" && dense ? { width: 34, height: 34 } : { width: node.dimension === "category" ? 230 : 310, height: 64 };
  for (let pass = 0; pass < 60; pass++) {
    for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i], b = positions[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const fa = footprint(nodes[i]), fb = footprint(nodes[j]);
      const overlapX = (fa.width + fb.width) / 2 - Math.abs(dx);
      const overlapY = (fa.height + fb.height) / 2 - Math.abs(dy);
      if (overlapX <= 0 || overlapY <= 0) continue;
      const divisor = a.pinned || b.pinned ? 1 : 2;
      if (overlapX < overlapY * 2) {
        const push = (overlapX + 3) / divisor;
        const direction = dx < 0 ? -1 : 1;
        if (!a.pinned) a.x -= push * direction;
        if (!b.pinned) b.x += push * direction;
      } else {
        const push = (overlapY + 3) / divisor;
        const direction = dy < 0 ? -1 : 1;
        if (!a.pinned) a.y -= push * direction;
        if (!b.pinned) b.y += push * direction;
      }
    }
  }
  return positions;
}
