import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARC_CENTER,
  ARC_STATS,
  buildArcPath,
  computeArcLength,
  computeParallaxTarget,
  lerp,
  polarToCartesian,
} from './heroGeometry';

test('polarToCartesian converts polar coordinates accurately', () => {
  const top = polarToCartesian({ x: 0, y: 0 }, 100, -90);
  assert.equal(top.x, 0);
  assert.equal(top.y, -100);

  const right = polarToCartesian({ x: 10, y: 20 }, 50, 0);
  assert.equal(right.x, 60);
  assert.equal(right.y, 20);
});

test('computeArcLength calculates r * deltaAngle in radians', () => {
  const len = computeArcLength(330, -92, 16);
  const expected = Number((330 * ((108 * Math.PI) / 180)).toFixed(2));
  assert.equal(len, expected);
});

test('buildArcPath generates SVG arc path with A r r 0 0 1 for all stats', () => {
  for (const stat of ARC_STATS) {
    const path = buildArcPath(ARC_CENTER, stat.r, stat.startAngle, stat.endAngle);
    assert.match(path, new RegExp(`^M -?\\d+(\\.\\d+)? -?\\d+(\\.\\d+)? A ${stat.r} ${stat.r} 0 0 1 `));
    const dot = polarToCartesian(ARC_CENTER, stat.r, stat.dotAngle);
    assert.ok(dot.x > 0 && dot.x < 380, `dot.x (${dot.x}) within viewBox width`);
    assert.ok(dot.y > 0 && dot.y < 700, `dot.y (${dot.y}) within viewBox height`);
  }
});

test('lerp and computeParallaxTarget behave deterministically', () => {
  assert.equal(lerp(0, 100, 0.1), 10);
  assert.equal(computeParallaxTarget(-999, 1440, 16), 0);
  assert.equal(computeParallaxTarget(720, 1440, 16), 0);
  assert.equal(computeParallaxTarget(1440, 1440, 16), 8);
  assert.equal(computeParallaxTarget(0, 1440, 16), -8);
});
