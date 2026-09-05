const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const SandPhysics = require('./sand-physics.js');

// Exercise the actual glass silhouette used by the app, including its stepped
// edges and omitted scanlines, rather than an idealized rectangular container.
const source = fs.readFileSync(path.join(__dirname, 'sand-timer.jsx'), 'utf8');
const rows = JSON.parse(source.match(/const GLASS_ROWS = (.*);/)[1]);
const createSimulation = () => SandPhysics.fromGlass({
  width: 124, height: 280, rows, neckRow: 129, duration: 120,
});
const renderSource = source.slice(source.indexOf('const SAND_COLORS'), source.indexOf('const FONT'));
const { drawSand, projectSandFront } = vm.runInNewContext(`const CX = 62; ${renderSource}; ({ drawSand, projectSandFront })`);
function render(simulation) {
  const pixels = new Map();
  drawSand(simulation, 0, 0, 1, (x, y, color) => pixels.set(y * 124 + x, color.join(',')));
  return pixels;
}
function inventory(simulation) {
  const tones = new Array(6).fill(0);
  let upper = 0;
  simulation.cells.forEach((tone, index) => {
    if (!tone) return;
    assert.equal(simulation.mask[index], 1, 'grain escaped the glass');
    tones[tone]++;
    if (index < simulation.neckRow * simulation.width) upper++;
  });
  return { tones, upper };
}

test('conserves every grain and its tone for the full timer, then settles', () => {
  const simulation = createSimulation();
  const initial = inventory(simulation);
  let previousUpper = initial.upper;
  for (const elapsed of [0.5, 1, 10, 30, 60, 90, 118.5, 120]) {
    simulation.advance(elapsed);
    const current = inventory(simulation);
    assert.deepEqual(current.tones, initial.tones);
    assert.ok(current.upper <= previousUpper);
    previousUpper = current.upper;
    const expected = Math.floor(simulation.total * Math.min(1, elapsed / 118.5));
    // Local avalanches can briefly lag the gate, particularly for the last
    // few grains. Permit 0.3 seconds of flow, but require exact completion.
    assert.ok(Math.abs(simulation.released - expected) <= Math.ceil(simulation.total / 118.5 * 0.3), 'neck flow drifted from timer');
  }
  assert.equal(previousUpper, 0, 'sand remains in the upper chamber at 0:00');
  const completed = simulation.cells.slice();
  for (let i = 0; i < 120; i++) simulation.step();
  assert.deepEqual(simulation.cells, completed, 'pile was still falling at completion');
});

test('pause freezes grain positions and momentum, then resumes deterministically', () => {
  const simulation = createSimulation();
  simulation.advance(12.5);
  const cells = simulation.cells.slice();
  const velocity = simulation.velocity.slice();
  for (let i = 0; i < 60; i++) simulation.advance(12.5);
  assert.deepEqual(simulation.cells, cells);
  assert.deepEqual(simulation.velocity, velocity);
  simulation.advance(13);
  const uninterrupted = createSimulation();
  uninterrupted.advance(13);
  assert.deepEqual(simulation.cells, uninterrupted.cells);
});

test('produces identical results at 30, 60, and 144 fps and after a background gap', () => {
  const expected = createSimulation();
  expected.advance(20);
  for (const fps of [30, 60, 144]) {
    const simulation = createSimulation();
    for (let frame = 1; frame <= fps * 20; frame++) simulation.advance(frame / fps);
    assert.deepEqual(simulation.cells, expected.cells);
    assert.equal(simulation.released, expected.released);
  }
});

test('a reset after completion restores the full starting bed', () => {
  const simulation = createSimulation();
  const initial = simulation.cells.slice();
  simulation.advance(120);
  simulation.advance(0);
  assert.equal(simulation.released, 0);
  assert.deepEqual(simulation.cells, initial);
  assert.ok(simulation.velocity.every(value => value === 0));
  simulation.advance(1);
  assert.ok(simulation.released > 0);
});

test('both surfaces settle at a gentle repose angle, not the grid diagonal', () => {
  const simulation = createSimulation();
  const { center, grainSize } = simulation;
  const shoulders = [Math.floor(30 / grainSize), Math.floor(94 / grainSize)];
  simulation.advance(60);
  const surfaceAt = x => {
    for (let y = simulation.firstRow; y < simulation.neckRow; y++) {
      if (simulation.cells[y * simulation.width + x]) return y;
    }
    return simulation.neckRow;
  };
  for (const x of shoulders) {
    assert.ok(surfaceAt(center) > surfaceAt(x) + 8 / grainSize);
    const slope = (surfaceAt(center) - surfaceAt(x)) / Math.abs(center - x);
    const angle = Math.atan(slope) * 180 / Math.PI;
    assert.ok(angle >= 22 && angle <= 35, `upper surface is too steep or flat: ${angle}`);
  }
  simulation.advance(120);
  const pileAt = x => {
    for (let y = simulation.neckRow; y <= simulation.lastRow; y++) {
      if (simulation.cells[y * simulation.width + x]) return y;
    }
    return simulation.lastRow + 1;
  };
  for (const x of shoulders) {
    const slope = (pileAt(x) - pileAt(center)) / Math.abs(center - x);
    const angle = Math.atan(slope) * 180 / Math.PI;
    assert.ok(angle >= 22 && angle <= 35, `lower pile is too steep or flat: ${angle}`);
  }
});

test('an exposed grain rolls over a ledge, but cannot roll through buried sand', () => {
  const simulation = createSimulation();
  const { cells, width } = simulation;
  cells.fill(0);
  simulation.released = simulation.total; // Closed outlet; isolate settling.
  // A sloping ledge: only a surface roll can reach the lower step on the right.
  const x0 = simulation.center;
  const y0 = Math.floor(242 / simulation.grainSize);
  for (let x = x0 - 10; x <= x0 + 4; x++) {
    for (let y = y0; y <= simulation.lastRow; y++) cells[y * width + x] = 3;
  }
  cells[(y0 - 1) * width + x0] = 5;
  cells[y0 * width + x0 + 2] = 0;
  simulation.step();
  assert.equal(cells[(y0 - 1) * width + x0], 0);
  assert.equal(cells[y0 * width + x0 + 2], 5, 'exposed grain did not roll onto the lower step');

  cells[(y0 - 1) * width + x0] = 5;
  cells[(y0 - 2) * width + x0] = 3; // Bury the grain under another layer.
  cells[y0 * width + x0 + 2] = 0;
  simulation.step();
  assert.equal(cells[(y0 - 1) * width + x0], 5, 'buried grain tunneled sideways through the bed');
});

test('the bottom layer leaves first and loss of support settles the bed upward', () => {
  const simulation = createSimulation();
  const { cells, width, neckRow, center } = simulation;
  cells.forEach((tone, index) => { if (tone) cells[index] = 1; });
  for (const x of simulation.outletColumns) cells[(neckRow - 1) * width + x] = 5;
  simulation.drainUpperBed(1);
  assert.equal(simulation.released, 1);
  assert.equal(cells[neckRow * width + center], 5, 'outgoing grain was not from the bottom layer');
  assert.equal(cells[(neckRow - 1) * width + center], 1, 'bed did not refill the outlet');
  assert.equal(inventory(simulation).upper, simulation.total - 1);
});

test('the upper bed stays packed rather than showing rising air pockets', () => {
  const simulation = createSimulation();
  const { cells, mask, width, neckRow } = simulation;
  for (const elapsed of [0.5, 1, 10, 30, 60, 90, 110]) {
    simulation.advance(elapsed);
    for (let index = simulation.firstRow * width; index < (neckRow - 1) * width; index++) {
      if (cells[index] && mask[index + width]) {
        assert.ok(cells[index + width], `unsupported bed at ${elapsed}s, cell ${index}`);
      }
    }
  }
});

test('the visible sand uses solid 2 by 2 pixel-art blocks', () => {
  const simulation = createSimulation();
  assert.equal(simulation.grainSize, 2);
  assert.equal(simulation.width, 62);
  assert.equal(simulation.height, 140);
  simulation.advance(60);
  const pixels = render(simulation);
  assert.ok(pixels.size > 0);
  assert.equal(pixels.size % 4, 0);
  pixels.forEach((_, index) => {
    const x = Math.floor(index % 124 / 2) * 2;
    const y = Math.floor(Math.floor(index / 124) / 2) * 2;
    const color = pixels.get(y * 124 + x);
    for (const offset of [1, 124, 125]) assert.equal(pixels.get(y * 124 + x + offset), color);
  });
});

test('front-view level follows remaining sand, not the hidden center funnel', () => {
  const simulation = createSimulation();
  simulation.advance(60);
  const initial = inventory(simulation);
  const { upperFace, topSurface } = projectSandFront(simulation);
  assert.equal(upperFace.reduce((sum, value) => sum + value, 0), initial.upper);
  // Ignore the artwork's stepped outer wall; compare the unobstructed face.
  const visibleTops = [...topSurface].slice(Math.ceil(simulation.width / 4), Math.floor(simulation.width * 3 / 4));
  assert.ok(Math.max(...visibleTops) - Math.min(...visibleTops) <= 1, 'head-on view exposed the internal V-shaped cutaway');
  for (let y = topSurface[simulation.center]; y < simulation.neckRow; y++) {
    assert.equal(upperFace[y * simulation.width + simulation.center], 1, 'drain channel became visible through the front face');
  }
});

test('the top row recedes from the center outward, leaving the edges until last', () => {
  for (const width of [9, 10]) {
    const simulation = {
      width, firstRow: 0, neckRow: 3, lastRow: 5,
      cells: new Uint8Array(width * 6),
      mask: new Uint8Array(width * 6).fill(1),
      bounds: Array.from({ length: 6 }, () => [0, width - 1]),
    };
    let previousRow = null;
    let previousDistance = -1;
    for (let remaining = width; remaining >= 0; remaining--) {
      simulation.cells.fill(0);
      simulation.cells.fill(3, 0, width + remaining);
      const { upperFace, topSurface } = projectSandFront(simulation);
      const row = Array.from(upperFace.slice(width, 2 * width));
      assert.equal(upperFace.reduce((sum, value) => sum + value, 0), width + remaining);
      assert.ok(upperFace.slice(2 * width, 3 * width).every(value => value === 1), 'surface dip exposed the buried bed');
      assert.ok(Math.max(...topSurface) - Math.min(...topSurface) <= 1);
      if (previousRow) {
        const removed = [];
        row.forEach((value, x) => {
          assert.ok(value <= previousRow[x], 'a drained surface grain reappeared');
          if (value < previousRow[x]) removed.push(x);
        });
        assert.equal(removed.length, 1);
        const distance = Math.abs(removed[0] - (width - 1) / 2);
        assert.ok(distance >= previousDistance, 'surface receded toward the center');
        previousDistance = distance;
      }
      if (remaining >= 2) assert.equal(row[0] + row[width - 1], 2, 'edges drained too early');
      previousRow = row;
    }
  }
});

test('buried grain tones do not make the internal flow visible through the face', () => {
  const simulation = createSimulation();
  simulation.advance(60);
  const before = render(simulation);
  for (let i = 0; i < simulation.neckRow * simulation.width; i++) {
    if (simulation.cells[i]) simulation.cells[i] = 6 - simulation.cells[i];
  }
  assert.deepEqual(render(simulation), before);
});

test('draining changes the surface without animating a stripe through the upper face', () => {
  const simulation = createSimulation();
  simulation.advance(60);
  const before = render(simulation);
  const first = projectSandFront(simulation);
  simulation.advance(60.5);
  const after = render(simulation);
  const second = projectSandFront(simulation);
  let checked = 0;
  for (let y = simulation.firstRow; y < simulation.neckRow; y++) {
    for (let x = 0; x < simulation.width; x++) {
      const index = y * simulation.width + x;
      if (!first.upperFace[index] || !second.upperFace[index]) continue;
      if (y <= Math.max(first.topSurface[x], second.topSurface[x]) + 1) continue;
      const pixel = y * 2 * 124 + x * 2;
      assert.equal(after.get(pixel), before.get(pixel), `hidden flow leaked through at ${x},${y}`);
      checked++;
    }
  }
  assert.ok(checked > 500);
  assert.notDeepEqual(before, after, 'surface and stream failed to advance');
});

test('projection is read-only and an isolated neck grain does not become a fake pile', () => {
  const simulation = createSimulation();
  simulation.cells.fill(0);
  const { width, neckRow, center } = simulation;
  simulation.cells[(neckRow - 1) * width + center] = 3;
  simulation.cells[(neckRow + 3) * width + center] = 5;
  const snapshot = simulation.cells.slice();
  const tick = simulation.tick;
  const { bottomSurface } = projectSandFront(simulation);
  assert.equal(bottomSurface[center], simulation.lastRow + 1);
  const pixels = render(simulation);
  assert.equal(pixels.size, 8, 'renderer fabricated a stream or pile between actual grains');
  assert.ok(pixels.has((neckRow + 3) * 2 * 124 + center * 2));
  assert.deepEqual(simulation.cells, snapshot);
  assert.equal(simulation.tick, tick);
});
