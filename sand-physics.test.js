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
const createSimulation = (options = {}) => SandPhysics.fromGlass({
  width: 124, height: 280, rows, neckRow: 129, duration: 120,
  ...options,
});
const renderSource = source.slice(source.indexOf('const SAND_COLORS'), source.indexOf('const FONT'));
const { drawSand, projectSandFront, sandGrainSize, sandFaceTexture } = vm.runInNewContext(
  `const CX = 62; ${renderSource}; ({ drawSand, projectSandFront, sandGrainSize, sandFaceTexture })`,
  { URLSearchParams },
);
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
function airborneCount(simulation) {
  const { width, neckRow, lastRow, cells } = simulation;
  const { bottomSurface } = projectSandFront(simulation);
  let count = 0;
  for (let y = neckRow; y <= lastRow; y++) {
    for (let x = 0; x < width; x++) {
      if (cells[y * width + x] && y < bottomSurface[x]) count++;
    }
  }
  return count;
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

test('repeating the same elapsed time does not advance the release clock', () => {
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

test('pause closes the outlet but lets airborne grains land, without advancing the timer', () => {
  for (const grainSize of [2, 3]) {
    const simulation = createSimulation({ grainSize });
    simulation.advance(12.5);
    const before = inventory(simulation);
    const cells = simulation.cells.slice();
    const upperEnd = simulation.neckRow * simulation.width;
    const tick = simulation.tick;
    const released = simulation.released;
    const upperTexture = sandFaceTexture(simulation).slice();
    assert.ok(airborneCount(simulation) > 0, 'pause fixture has no in-flight grains');
    for (let frame = 0; frame < 120; frame++) simulation.settlePaused(1 / 60);
    assert.equal(simulation.tick, tick, 'pause advanced the countdown clock');
    assert.equal(simulation.released, released, 'new grains left the neck during pause');
    assert.deepEqual(simulation.cells.slice(0, upperEnd), cells.slice(0, upperEnd));
    assert.deepEqual(inventory(simulation), before);
    assert.notDeepEqual(simulation.cells, cells, 'falling grains stayed frozen');
    assert.equal(airborneCount(simulation), 0, 'grains remained suspended after pause');
    assert.equal(simulation.lowerSettled, true);
    assert.deepEqual(sandFaceTexture(simulation), upperTexture, 'upper texture shimmered while paused');
    const rested = render(simulation);
    simulation.settlePaused(3600);
    assert.deepEqual(render(simulation), rested, 'settled sand kept moving during a long pause');
    simulation.advance(13);
    const target = Math.floor(simulation.total * 13 / 118.5);
    assert.ok(Math.abs(simulation.released - target) <= 1, 'resume released a burst for paused time');
    assert.deepEqual(inventory(simulation).tones, before.tones);
    simulation.advance(0);
    assert.equal(simulation.settlingTick, 0);
    assert.equal(simulation.settlingRemainder, 0);
    assert.deepEqual(simulation.cells, createSimulation({ grainSize }).cells);
  }
});

test('paused settling and resume are identical across frame rates and a background gap', () => {
  for (const grainSize of [2, 3]) {
    const expected = createSimulation({ grainSize });
    expected.advance(12.5);
    expected.settlePaused(2);
    expected.advance(13);
    for (const fps of [30, 60, 144]) {
      const simulation = createSimulation({ grainSize });
      simulation.advance(12.5);
      for (let frame = 0; frame < fps * 2; frame++) simulation.settlePaused(1 / fps);
      simulation.advance(13);
      assert.deepEqual(simulation.cells, expected.cells);
      assert.deepEqual(simulation.velocity, expected.velocity);
      assert.equal(simulation.released, expected.released);
    }
  }
});

test('repeated pauses still finish with every grain in the lower chamber', () => {
  for (const grainSize of [2, 3]) {
    const simulation = createSimulation({ grainSize });
    const initial = inventory(simulation);
    for (const elapsed of [1, 12.5, 30, 60, 90, 110, 120]) {
      simulation.advance(elapsed);
      const released = simulation.released;
      simulation.settlePaused(2);
      assert.equal(simulation.released, released);
      assert.deepEqual(inventory(simulation).tones, initial.tones);
    }
    assert.equal(inventory(simulation).upper, 0);
    assert.equal(airborneCount(simulation), 0);
    assert.equal(simulation.tick, 120 * simulation.stepsPerSecond);
  }
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

test('the app defaults to chunky grains and preserves the smaller comparison', () => {
  for (const search of ['', '?grain=3', '?grain=invalid', '?grain=0']) {
    assert.equal(sandGrainSize(search), 3);
  }
  assert.equal(sandGrainSize('?grain=2'), 2);
});

test('the page and offline cache request matching versioned physics and renderer assets', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const worker = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
  const physics = html.match(/src="(sand-physics\.js\?v=[^"]+)"/)[1];
  const renderer = html.match(/src="(sand-timer\.jsx\?v=[^"]+)"/)[1];
  assert.equal(physics.split('?v=')[1], renderer.split('?v=')[1]);
  for (const asset of [physics, renderer]) assert.ok(worker.includes(`"./${asset}"`));
});

test('both grain sizes render as solid pixel-art blocks', () => {
  for (const grainSize of [2, 3]) {
    const simulation = createSimulation({ grainSize });
    assert.equal(simulation.grainSize, grainSize);
    assert.equal(simulation.width, Math.ceil(124 / grainSize));
    assert.equal(simulation.height, Math.ceil(280 / grainSize));
    simulation.advance(60);
    const pixels = render(simulation);
    assert.ok(pixels.size > 0);
    assert.equal(pixels.size % (grainSize * grainSize), 0);
    pixels.forEach((_, index) => {
      const x = Math.floor(index % 124 / grainSize) * grainSize;
      const y = Math.floor(Math.floor(index / 124) / grainSize) * grainSize;
      const color = pixels.get(y * 124 + x);
      for (let dy = 0; dy < grainSize; dy++) {
        for (let dx = 0; dx < grainSize; dx++) {
          assert.equal(pixels.get((y + dy) * 124 + x + dx), color);
        }
      }
    });
  }
});

test('the chunkier sand conserves its grains, finishes on time, and resets', () => {
  const simulation = createSimulation({ grainSize: 3 });
  const startingCells = simulation.cells.slice();
  const initial = inventory(simulation);
  let previousUpper = initial.upper;
  for (const elapsed of [0.5, 1, 10, 30, 60, 90, 118.5, 120]) {
    simulation.advance(elapsed);
    const current = inventory(simulation);
    assert.deepEqual(current.tones, initial.tones);
    assert.ok(current.upper <= previousUpper);
    previousUpper = current.upper;
    const { upperFace } = projectSandFront(simulation);
    assert.equal(upperFace.reduce((sum, value) => sum + value, 0), current.upper);
  }
  assert.equal(previousUpper, 0, 'chunkier grains remained above the neck at 0:00');
  const completed = simulation.cells.slice();
  for (let i = 0; i < 120; i++) simulation.step();
  assert.deepEqual(simulation.cells, completed, 'chunkier pile was still settling at completion');
  simulation.advance(0);
  assert.deepEqual(simulation.cells, startingCells);
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

test('draining only nudges a few front-facing grains while keeping the bed opaque', () => {
  const simulation = createSimulation();
  simulation.advance(60);
  const before = render(simulation);
  const first = projectSandFront(simulation);
  const releasedBefore = simulation.released;
  simulation.advance(60.5);
  const after = render(simulation);
  const second = projectSandFront(simulation);
  let checked = 0;
  let changed = 0;
  let nearMouth = 0;
  for (let y = simulation.firstRow; y < simulation.neckRow; y++) {
    for (let x = 0; x < simulation.width; x++) {
      const index = y * simulation.width + x;
      if (!first.upperFace[index] || !second.upperFace[index]) continue;
      if (y <= Math.max(first.topSurface[x], second.topSurface[x]) + 1) continue;
      const pixel = y * 2 * 124 + x * 2;
      assert.ok(after.has(pixel), 'texture motion punched a hole in the front face');
      if (after.get(pixel) !== before.get(pixel)) {
        changed++;
        if ((simulation.neckRow - y) * simulation.grainSize <= 32) nearMouth++;
      }
      checked++;
    }
  }
  assert.ok(checked > 500);
  assert.ok(changed > 0, 'the upper texture is still completely static');
  assert.ok(changed <= 2 * (simulation.released - releasedBefore), 'too much of the face changed at once');
  assert.ok(nearMouth > 0, 'no movement near the mouth');
  assert.notDeepEqual(before, after, 'surface and stream failed to advance');
});

test('front texture shifts are neighboring exchanges concentrated near the mouth', () => {
  const simulation = createSimulation({ grainSize: 3 });
  let previous = sandFaceTexture(simulation).slice();
  let exchanges = 0;
  let nearMouth = 0;
  for (let event = 1; event <= 120; event++) {
    simulation.released = event; // Isolate the decorative response to outflow.
    const current = sandFaceTexture(simulation).slice();
    const changed = [];
    current.forEach((tone, index) => { if (tone !== previous[index]) changed.push(index); });
    assert.ok(changed.length === 0 || changed.length === 2, 'texture shuffled more than a neighboring pair');
    if (changed.length) {
      const [from, to] = changed;
      const y = Math.floor(from / simulation.width);
      assert.equal(Math.floor(to / simulation.width), y + 1);
      assert.ok(Math.abs(to % simulation.width - from % simulation.width) <= 1);
      assert.equal(current[from], previous[to]);
      assert.equal(current[to], previous[from]);
      assert.ok(to < simulation.neckRow * simulation.width, 'lower pile texture moved');
      exchanges++;
      if ((simulation.neckRow - y) * simulation.grainSize <= 33) nearMouth++;
    }
    previous = current;
  }
  assert.ok(exchanges > 20, 'front texture barely moved');
  assert.ok(nearMouth > exchanges * 0.7, 'motion was not concentrated near the mouth');
});

test('front texture is deterministic across render rates and restores on reset', () => {
  const direct = createSimulation({ grainSize: 3 });
  const initial = render(direct);
  direct.advance(10);
  const expected = render(direct);
  const frequent = createSimulation({ grainSize: 3 });
  for (let frame = 1; frame <= 300; frame++) {
    frequent.advance(frame / 30);
    sandFaceTexture(frequent);
  }
  assert.deepEqual(render(frequent), expected);
  frequent.advance(0);
  assert.deepEqual(render(frequent), initial);
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
