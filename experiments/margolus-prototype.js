// Unfinished research prototype; deliberately not loaded by the app.
// Falling-sand cellular automaton. No DOM dependency, so the same simulation
// drives the canvas and can be checked at different frame rates in Node.
// Modified Margolus block CA, following Fig. 2 and the four offsets in Sec. II:
// https://arxiv.org/html/2008.06341 (Devlin & Schuster, 2020).
// Both chambers use the SAME rules. Only the physical outlet is rate-limited
// for the clock; no upper-bed compaction, surface emitter, or grain relocation.
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
    return simulation;
  }

  constructor({ width, height, rows, neckRow, duration, toppleProbability = 0.75 }) {
    this.width = width;
    this.height = height;
    this.neckRow = neckRow;
    this.duration = duration;
    this.stepsPerSecond = 240;
    this.toppleProbability = toppleProbability;
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
    this.reset();
  }

  noise(value) {
    let n = Math.imul(value + 1, 374761393);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  reset() {
    this.cells.fill(0);
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

  releaseTarget(tick) {
    // Timing throttles only adjacent moves THROUGH the neck. A missing grain
    // at the outlet must be supplied by local gravity, never fetched from above.
    const releaseDuration = Math.max(this.duration * 0.5, this.duration - 1.5);
    return Math.floor(this.total * Math.min(1, tick / this.stepsPerSecond / releaseDuration));
  }

  transfer(from, to, releaseLimit) {
    const boundary = this.neckRow * this.width;
    const crossing = from < boundary && to >= boundary;
    if (crossing && this.released >= releaseLimit) return;
    this.cells[to] = this.cells[from];
    this.cells[from] = 0;
    if (crossing) this.released++;
  }

  updateBlock(x, y, releaseLimit) {
    const { width, cells, mask } = this;
    const a = y * width + x; // top left
    const b = a + 1;        // top right
    const c = a + width;    // bottom left
    const d = c + 1;        // bottom right
    const emptyA = mask[a] && !cells[a];
    const emptyB = mask[b] && !cells[b];
    const emptyC = mask[c] && !cells[c];
    const emptyD = mask[d] && !cells[d];
    const fallLeft = cells[a] && emptyC;
    const fallRight = cells[b] && emptyD;

    // Evaluate from the block's ORIGINAL state. Every grain moves at most one
    // cell per partition, even when its supporting neighbor also moves.
    // These are the deterministic falling transitions in Fig. 2(a-h).
    if (fallLeft || fallRight) {
      if (fallLeft) this.transfer(a, c, releaseLimit);
      if (fallRight) this.transfer(b, d, releaseLimit);
      return;
    }

    // Fig. 2(i-j): a supported grain can topple into an adjacent empty column.
    // Requiring both side cells to be empty prevents tunneling through a packed
    // bed or a wall. Probability approximates friction, not creation/removal.
    if (this.noise(a + this.tick * 131) >= this.toppleProbability) return;
    if (cells[a] && emptyB && emptyD) this.transfer(a, d, releaseLimit);
    else if (cells[b] && emptyA && emptyC) this.transfer(b, c, releaseLimit);
  }

  step(releaseLimit = this.releaseTarget(this.tick + 1)) {
    // Non-overlapping partitions: (0,0), (1,1), (0,1), (1,0).
    // A vacancy can affect only this 2x2 neighborhood during one step. It cannot
    // race up a column and move the surface in the same update as an exit.
    const phase = this.tick % 4;
    const xOffset = phase % 2;
    const yOffset = phase === 1 || phase === 2 ? 1 : 0;
    this.tick++;
    for (let y = yOffset; y < this.height - 1; y += 2) {
      for (let x = xOffset; x < this.width - 1; x += 2) {
        this.updateBlock(x, y, releaseLimit);
      }
    }
  }

  advance(elapsed) {
    const targetTick = Math.floor(Math.max(0, Math.min(this.duration, elapsed)) * this.stepsPerSecond + 0.000001);
    if (targetTick < this.tick) this.reset();
    while (this.tick < targetTick) this.step();
  }
}

if (typeof module !== "undefined") module.exports = SandPhysics;
