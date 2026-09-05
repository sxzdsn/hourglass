// Falling-sand cellular automaton. No DOM dependency, so the same simulation
// drives the canvas and can be checked at different frame rates in Node.
// Sequential local rules, not a Margolus block automaton. Relevant references:
// https://hackaday.io/project/165620-digital-hourglass (local gravity/empty-space rules)
// https://arxiv.org/html/2008.06341 (alternative: probabilistic 2x2 block updates)
class SandPhysics {
  static fromGlass({ grainSize = 2, ...options }) {
    const rows = new Map();
    for (const [y, left, right] of options.rows) {
      const row = Math.floor(y / grainSize);
      const bounds = [Math.ceil(left / grainSize), Math.floor((right + 1) / grainSize) - 1];
      const existing = rows.get(row);
      rows.set(row, existing ? [Math.max(existing[0], bounds[0]), Math.min(existing[1], bounds[1])] : bounds);
    }
    const simulation = new SandPhysics({
      ...options,
      width: Math.ceil(options.width / grainSize),
      height: Math.ceil(options.height / grainSize),
      neckRow: Math.floor(options.neckRow / grainSize),
      rows: Array.from(rows, ([y, bounds]) => [y, ...bounds]),
    });
    simulation.grainSize = grainSize;
    simulation.stepsPerSecond = 60;
    return simulation;
  }

  constructor({ width, height, rows, neckRow, duration }) {
    this.width = width;
    this.height = height;
    this.neckRow = neckRow;
    this.duration = duration;
    this.stepsPerSecond = 90;
    this.center = Math.floor(width / 2);
    this.firstRow = rows[0][0];
    this.lastRow = rows[rows.length - 1][0];
    this.bounds = new Array(height).fill(null);
    rows.forEach(([y, left, right]) => { this.bounds[y] = [left, right]; });

    // The artwork's scanlines have gaps. Interpolate them so an omitted row
    // doesn't become an invisible shelf that traps the sand.
    for (let y = this.firstRow; y <= this.lastRow; y++) {
      if (this.bounds[y]) continue;
      let next = y + 1;
      while (!this.bounds[next]) next++;
      const previous = this.bounds[y - 1];
      const fraction = 1 / (next - y + 1);
      this.bounds[y] = previous.map((value, i) => Math.round(value + (this.bounds[next][i] - value) * fraction));
    }
    this.bounds[neckRow] = [this.center - 1, this.center + 1];
    // Remove tiny ledges in the stepped sprite: every upper cell must have a
    // downward or diagonal route to the three-cell outlet.
    for (let y = neckRow - 1; y >= this.firstRow; y--) {
      this.bounds[y][0] = Math.max(this.bounds[y][0], this.bounds[y + 1][0] - 1);
      this.bounds[y][1] = Math.min(this.bounds[y][1], this.bounds[y + 1][1] + 1);
    }
    const outletBounds = this.bounds[neckRow - 1];
    this.outletColumns = Array.from({ length: outletBounds[1] - outletBounds[0] + 1 }, (_, i) => outletBounds[0] + i)
      .sort((a, b) => Math.abs(a - this.center) - Math.abs(b - this.center));
    this.mask = new Uint8Array(width * height);
    let topCapacity = 0;
    let bottomCapacity = 0;
    for (let y = this.firstRow; y <= this.lastRow; y++) {
      const [left, right] = this.bounds[y];
      for (let x = left; x <= right; x++) {
        this.mask[y * width + x] = 1;
        if (y < neckRow) topCapacity++;
        if (y > neckRow) bottomCapacity++;
      }
    }
    this.total = Math.floor(Math.min(topCapacity, bottomCapacity) * 0.9);
    this.cells = new Uint8Array(width * height);
    this.previous = new Uint8Array(width * height);
    this.velocity = new Uint8Array(width * height);
    this.reset();
  }

  noise(value) {
    let n = Math.imul(value + 1, 374761393);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  reset() {
    this.cells.fill(0);
    this.velocity.fill(0);
    this.tick = 0;
    this.released = 0;
    let remaining = this.total;
    for (let y = this.neckRow - 1; y >= this.firstRow && remaining; y--) {
      const [left, right] = this.bounds[y];
      const columns = Array.from({ length: right - left + 1 }, (_, i) => left + i);
      columns.sort((a, b) => this.noise(y * this.width + a) - this.noise(y * this.width + b));
      for (const x of columns) {
        if (!remaining) break;
        const index = y * this.width + x;
        const noise = this.noise(index);
        // Store the tone with each grain, so its texture travels with it.
        this.cells[index] = noise < 0.12 ? 1 : noise > 0.9 ? 5 : noise > 0.6 ? 4 : 3;
        remaining--;
      }
    }
  }

  moveGrain(from, to, speed = 1) {
    this.cells[to] = this.cells[from];
    this.velocity[to] = speed;
    this.cells[from] = 0;
    this.velocity[from] = 0;
  }

  settleUpperColumns() {
    const { width, cells, mask } = this;
    // Resolve loss of support from the outlet upward in the same tick. Every
    // grain moves one cell; the packed column settles as a body instead of a
    // visible air pocket slowly bubbling up through the reservoir.
    for (let y = this.neckRow - 2; y >= this.firstRow; y--) {
      const [left, right] = this.bounds[y];
      for (let x = left; x <= right; x++) {
        const index = y * width + x;
        if (cells[index] && mask[index + width] && !cells[index + width]) {
          this.moveGrain(index, index + width);
        }
      }
    }
  }

  drainUpperBed(target) {
    const { width, cells, mask, neckRow, center } = this;
    const side = this.tick % 2 ? 1 : -1;
    // Only grains physically touching the bottom opening can leave the bed.
    // Removing one of these grains causes the supported material to settle.
    for (const x of this.outletColumns) {
      if (this.released >= target) break;
      const outlet = (neckRow - 1) * width + x;
      if (!cells[outlet]) continue;
      for (const dx of [0, Math.sign(center - x)]) {
        const destination = outlet + width + dx;
        if (mask[destination] && !cells[destination]) {
          this.moveGrain(outlet, destination);
          this.released++;
          break;
        }
      }
    }
    this.settleUpperColumns();
    // Let neighboring material refill the depression after vertical support
    // has resolved. Surface grains retain B's gentle rolling rule.
    for (let y = neckRow - 2; y >= this.firstRow; y--) {
      const [left, right] = this.bounds[y];
      for (let x = side === 1 ? left : right; x >= left && x <= right; x += side) {
        const index = y * width + x;
        if (!cells[index]) continue;
        const exposed = !cells[index - width];
        const preference = this.noise(index + this.tick * 131) < 0.5 ? -1 : 1;
        let destination = index;
        for (const dx of [preference, -preference]) {
          const candidate = index + width + dx;
          if (mask[candidate] && !cells[candidate]) { destination = candidate; break; }
        }
        if (destination === index && exposed) {
          for (const dx of [preference, -preference]) {
            const intermediate = index + dx;
            const over = index + dx * 2;
            const candidate = over + width;
            if (!mask[intermediate] || !mask[over] || !mask[candidate]) continue;
            if (cells[intermediate] || cells[over] || cells[candidate]) continue;
            destination = candidate;
            break;
          }
        }
        if (destination !== index) this.moveGrain(index, destination);
      }
    }
    this.settleUpperColumns();
  }

  step() {
    this.tick++;
    // Leave time for the final grains to reach the pile before 0:00.
    const releaseDuration = Math.max(this.duration * 0.5, this.duration - 1.5);
    const target = Math.floor(this.total * Math.min(1, this.tick / this.stepsPerSecond / releaseDuration));
    const { width, cells, previous, velocity, mask, neckRow } = this;
    previous.set(cells);
    const direction = this.tick % 2 ? 1 : -1;
    // Free-falling grains and the receiving pile keep their local dynamics.
    // The packed upper reservoir is settled separately from its outlet up.
    for (let y = this.lastRow; y >= neckRow; y--) {
      const [left, right] = this.bounds[y];
      for (let x = direction === 1 ? left : right; x >= left && x <= right; x += direction) {
        const index = y * width + x;
        if (!cells[index]) continue;
        const below = index + width;
        const exposed = !previous[index - width];
        if ((!mask[below] || previous[below]) &&
            (!mask[below - 1] || previous[below - 1]) &&
            (!mask[below + 1] || previous[below + 1]) && !exposed) {
          velocity[index] = 0;
          continue;
        }
        const speed = Math.min(3, velocity[index] + 1);
        let destination = index;
        let nextY = y;
        // Read the previous grid, then reserve destinations in the next grid.
        // This prevents a vacancy racing up an entire column in one update.
        for (let fall = 1; fall <= speed; fall++) {
          const candidate = index + fall * width;
          if (!mask[candidate] || previous[candidate] || cells[candidate]) break;
          destination = candidate;
          nextY = y + fall;
        }
        if (destination === index) {
          // Vary diagonal preference and alternate scan order to avoid a
          // permanent left/right bias as small avalanches cross the surface.
          const side = this.noise(index + this.tick * 131) < 0.5 ? -1 : 1;
          for (const dx of [side, -side]) {
            const candidate = index + width + dx;
            if (!mask[candidate] || previous[candidate] || cells[candidate]) continue;
            destination = candidate;
            nextY = y + 1;
            break;
          }
          // A one-cell diagonal alone locks a square grid into 45-degree
          // slopes. Exposed grains can also roll over a supporting neighbor
          // before dropping, creating a gentler angle of repose. Check the
          // whole path so this cannot tunnel through packed sand or glass.
          if (destination === index && exposed) {
            for (const dx of [side, -side]) {
              const intermediate = index + dx;
              const over = index + dx * 2;
              const candidate = over + width;
              if (!mask[intermediate] || !mask[over] || !mask[candidate]) continue;
              if (previous[intermediate] || cells[intermediate] || previous[over] || cells[over]) continue;
              if (previous[candidate] || cells[candidate]) continue;
              destination = candidate;
              nextY = y + 1;
              break;
            }
          }
        }
        if (destination !== index) {
          cells[destination] = cells[index];
          velocity[destination] = nextY > y + 1 ? speed : 1;
          cells[index] = 0;
          velocity[index] = 0;
        } else {
          velocity[index] = 0;
        }
      }
    }
    this.drainUpperBed(target);
  }

  advance(elapsed) {
    const targetTick = Math.floor(Math.max(0, Math.min(this.duration, elapsed)) * this.stepsPerSecond + 0.000001);
    if (targetTick < this.tick) this.reset();
    while (this.tick < targetTick) this.step();
  }
}

if (typeof module !== "undefined") module.exports = SandPhysics;
