import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARC_CENTER,
  ARC_STATS,
  buildArcPath,
  computeArcLength,
  computeMagneticTarget,
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

test('computeMagneticTarget snaps toward anchor within 100px radius and stays inert outside', () => {
  const anchor = { x: 200, y: 700 };

  const offscreen = computeMagneticTarget({ x: -999, y: -999 }, anchor, 100);
  assert.equal(offscreen.active, false);
  assert.deepEqual(offscreen.buttonOffset, { x: 0, y: 0 });

  const outside = computeMagneticTarget({ x: 350, y: 700 }, anchor, 100);
  assert.equal(outside.active, false);
  assert.deepEqual(outside.target, { x: 350, y: 700 });
  assert.deepEqual(outside.buttonOffset, { x: 0, y: 0 });

  const near = computeMagneticTarget({ x: 250, y: 700 }, anchor, 100);
  assert.equal(near.active, true);
  assert.ok(near.target.x < 250 && near.target.x > 200, 'spotlight target pulls toward anchor');
  assert.equal(near.target.y, 700);
  assert.ok(near.buttonOffset.x > 0, 'button shifts slightly toward cursor');

  const centered = computeMagneticTarget({ x: 200, y: 700 }, anchor, 100);
  assert.equal(centered.active, true);
  assert.deepEqual(centered.target, anchor);
  assert.deepEqual(centered.buttonOffset, { x: 0, y: 0 });
});
