import { describe, expect, it } from "vitest";
import { capitalClusters, spaceClusterNodes } from "../client/src/lib/capitalClusters";
import type { ViewerRow } from "../client/src/lib/capitalViewerData";

const rows: ViewerRow[] = Array.from({ length: 38 }, (_, i) => ({ id: String(i), source: i % 2 ? "Rent" : "Finance", destination: i < 20 ? "Chappell" : "Stonepine", category: `Equipment ${i}`, purpose: "Plan", planned: 100, committed: null, paid: 0, month: null }));
describe("capital clusters", () => {
  it("summarizes records without double-counting and expands only the selected group", () => {
    const graph = capitalClusters(rows, "planned", new Set());
    expect(graph.nodes).toHaveLength(6);
    expect(graph.links.reduce((sum, link) => sum + link.value, 0)).toBe(3800);
    const group = graph.nodes.find(node => node.expandable)!;
    const expanded = capitalClusters(rows, "planned", new Set([group.key]));
    expect(expanded.nodes).toHaveLength(16);
    expect(new Set(expanded.nodes.map(node => node.key)).size).toBe(16);
    expect(expanded.nodes.filter(node => node.dimension === "category").map(node => node.recordIds[0]).sort()).toEqual([...group.recordIds].sort());
  });
  it("preserves pinned positions and keeps unpriced records discoverable", () => {
    const graph = capitalClusters([{ ...rows[0], planned: 0, unpriced: true }], "planned", new Set());
    expect(graph.nodes[0].unknown).toBe(1);
    expect(graph.links[0].value).toBe(0);
    const positions = spaceClusterNodes(graph.nodes, { [graph.nodes[0].key]: { x: 10, y: 20, z: 30 } });
    expect(positions[0]).toEqual({ x: 10, y: 20, z: 30, pinned: true });
  });
});
