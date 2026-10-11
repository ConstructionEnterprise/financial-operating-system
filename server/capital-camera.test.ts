import { describe, expect, it } from "vitest";
import { capitalCameraAt, screenDragToWorld } from "../client/src/lib/capitalCamera";

describe("capital camera and node movement", () => {
  it("keeps a continuous bounded tour without changing financial values", () => {
    for (let seconds = 0; seconds < 150; seconds += .25) {
      const pose = capitalCameraAt(seconds);
      expect(pose.angle).toBeGreaterThanOrEqual(-18);
      expect(pose.angle).toBeLessThanOrEqual(2);
      expect(pose.tilt).toBeGreaterThanOrEqual(-22);
      expect(pose.tilt).toBeLessThanOrEqual(38);
      expect(pose.zoom).toBeGreaterThanOrEqual(.84);
      expect(pose.zoom).toBeLessThanOrEqual(1);
      expect(Object.values(pose).every(Number.isFinite)).toBe(true);
    }
    expect(capitalCameraAt(0).angle).toBeCloseTo(capitalCameraAt(75).angle);
  });
  it("unprojects a screen drag into stable world-space coordinates", () => {
    expect(screenDragToWorld(20, 30, 1, 0, 0)).toEqual({ x: 20, y: 30, z: 0 });
    const yaw = -.4, pitch = .3, scale = .95;
    const moved = screenDragToWorld(40, -20, scale, yaw * 180 / Math.PI, pitch * 180 / Math.PI);
    const rx = moved.x * Math.cos(yaw) + moved.z * Math.sin(yaw);
    const rz = -moved.x * Math.sin(yaw) + moved.z * Math.cos(yaw);
    const ry = moved.y * Math.cos(pitch) - rz * Math.sin(pitch);
    expect(rx * scale).toBeCloseTo(40);
    expect(ry * scale).toBeCloseTo(-20);
  });
});
