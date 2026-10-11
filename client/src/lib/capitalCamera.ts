// A bounded, continuous camera tour: geometry moves, financial values do not.
export function capitalCameraAt(seconds: number) {
  const phase = seconds * Math.PI * 2 / 75;
  return {
    angle: -8 + 10 * Math.sin(phase),
    tilt: 8 + 30 * Math.sin(phase + .7),
    zoom: .92 + .08 * Math.sin(phase + .4),
    panX: 2 * Math.sin(phase * 2),
    panY: 3 * Math.sin(phase + .8),
  };
}

export type SpatialOffset = { x: number; y: number; z: number };
export function screenDragToWorld(dx: number, dy: number, scale: number, angle: number, tilt: number): SpatialOffset {
  const yaw = angle * Math.PI / 180, pitch = tilt * Math.PI / 180;
  const rx = dx / scale, ry = dy / scale, rz = -ry * Math.sin(pitch);
  return { x: rx * Math.cos(yaw) - rz * Math.sin(yaw), y: ry * Math.cos(pitch), z: rx * Math.sin(yaw) + rz * Math.cos(yaw) };
}
