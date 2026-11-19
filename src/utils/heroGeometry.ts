export interface Point2D {
  x: number;
  y: number;
}

export interface ArcStatSpec {
  id: string;
  r: number;
  startAngle: number;
  endAngle: number;
  dotAngle: number;
  value: string;
  suffix: string;
  label: string;
}

export const ARC_CENTER: Point2D = { x: -110, y: 300 };

export const ARC_STATS: ArcStatSpec[] = [
  {
    id: 'arc-years',
    r: 330,
    startAngle: -92,
    endAngle: 16,
    dotAngle: -46,
    value: '10',
    suffix: '+',
    label: 'YEARS REAL',
  },
  {
    id: 'arc-forms',
    r: 395,
    startAngle: -56,
    endAngle: 60,
    dotAngle: 2,
    value: '40',
    suffix: '+',
    label: 'USE FORMS',
  },
  {
    id: 'arc-repeat',
    r: 460,
    startAngle: -14,
    endAngle: 72,
    dotAngle: 44,
    value: '95',
    suffix: '%',
    label: 'REPEAT MEMBERS',
  },
];

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function polarToCartesian(center: Point2D, radius: number, angleDeg: number): Point2D {
  const rad = degToRad(angleDeg);
  return {
    x: Number((center.x + radius * Math.cos(rad)).toFixed(2)),
    y: Number((center.y + radius * Math.sin(rad)).toFixed(2)),
  };
}

export function computeArcLength(radius: number, startAngleDeg: number, endAngleDeg: number): number {
  const deltaRad = Math.abs(degToRad(endAngleDeg - startAngleDeg));
  return Number((radius * deltaRad).toFixed(2));
}

export function buildArcPath(
  center: Point2D,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
): string {
  const start = polarToCartesian(center, radius, startAngleDeg);
  const end = polarToCartesian(center, radius, endAngleDeg);
  const largeArcFlag = Math.abs(endAngleDeg - startAngleDeg) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export function computeParallaxTarget(
  cursorCoord: number,
  viewportSize: number,
  rangePx = 16,
): number {
  if (viewportSize <= 0 || cursorCoord < 0) {
    return 0;
  }
  const normalized = Math.min(Math.max(cursorCoord / viewportSize, 0), 1);
  return (normalized - 0.5) * rangePx;
}
