const { useEffect, useRef, useState } = React;

const TOTAL_GRAINS = 120;
const DISP_W = 124;
const DISP_H = 280;
const CX = 62;

const GLASS_ROWS = [[12, 28, 93], [13, 28, 93], [15, 23, 99], [16, 23, 99], [17, 28, 94], [18, 17, 105], [19, 17, 105], [20, 14, 108], [21, 15, 108], [22, 15, 108], [23, 12, 111], [24, 11, 111], [25, 12, 111], [26, 9, 114], [27, 8, 114], [28, 8, 114], [29, 8, 114], [30, 8, 114], [31, 8, 114], [32, 6, 117], [33, 6, 117], [34, 6, 117], [35, 6, 117], [36, 6, 117], [37, 6, 117], [38, 3, 120], [39, 3, 120], [40, 3, 120], [41, 3, 120], [42, 3, 120], [43, 3, 120], [44, 3, 120], [45, 3, 120], [46, 3, 120], [47, 3, 120], [48, 3, 120], [49, 3, 120], [50, 3, 120], [51, 3, 120], [52, 3, 120], [53, 3, 120], [54, 3, 120], [55, 3, 120], [56, 3, 120], [57, 3, 120], [58, 3, 120], [59, 3, 120], [60, 3, 120], [61, 3, 120], [62, 3, 120], [63, 3, 120], [64, 7, 117], [65, 5, 117], [66, 6, 117], [67, 7, 117], [68, 6, 117], [69, 6, 117], [70, 6, 117], [71, 6, 117], [72, 6, 117], [73, 8, 114], [74, 8, 114], [75, 8, 114], [76, 8, 114], [77, 8, 114], [78, 8, 114], [79, 8, 114], [80, 12, 111], [81, 12, 111], [82, 12, 111], [83, 11, 111], [84, 11, 108], [86, 16, 108], [87, 16, 108], [88, 15, 108], [89, 15, 108], [90, 14, 108], [92, 17, 105], [93, 17, 105], [94, 20, 100], [95, 20, 102], [96, 21, 103], [97, 23, 99], [98, 23, 99], [99, 26, 99], [100, 26, 93], [101, 26, 96], [102, 27, 96], [103, 28, 93], [104, 28, 93], [105, 28, 93], [106, 31, 90], [107, 31, 90], [108, 31, 90], [109, 34, 89], [110, 34, 89], [111, 34, 89], [112, 37, 86], [113, 37, 85], [114, 37, 86], [115, 40, 83], [116, 40, 83], [117, 40, 83], [118, 43, 80], [119, 43, 80], [120, 43, 80], [121, 46, 77], [122, 46, 77], [123, 49, 74], [124, 49, 74], [125, 49, 74], [126, 52, 71], [127, 52, 71], [128, 52, 71], [129, 55, 68], [130, 55, 68], [131, 55, 68], [132, 55, 68], [133, 55, 68], [134, 55, 68], [135, 55, 68], [136, 55, 68], [137, 55, 68], [138, 55, 68], [139, 55, 68], [140, 55, 68], [141, 52, 71], [142, 52, 71], [143, 52, 71], [144, 49, 74], [145, 49, 74], [146, 49, 74], [147, 46, 77], [148, 46, 76], [149, 46, 77], [150, 43, 80], [151, 43, 79], [152, 43, 80], [153, 40, 83], [154, 40, 83], [155, 40, 83], [156, 37, 86], [157, 37, 86], [159, 34, 87], [160, 34, 88], [161, 34, 89], [162, 31, 90], [163, 32, 90], [164, 28, 93], [165, 28, 93], [166, 28, 93], [167, 26, 94], [168, 26, 96], [169, 26, 96], [170, 23, 99], [171, 23, 99], [172, 23, 99], [173, 23, 99], [174, 23, 99], [175, 23, 99], [176, 20, 103], [177, 20, 102], [178, 20, 102], [179, 17, 105], [180, 17, 105], [181, 17, 105], [182, 17, 105], [183, 17, 105], [184, 17, 105], [185, 14, 108], [186, 14, 108], [187, 14, 108], [188, 14, 108], [189, 14, 108], [190, 14, 108], [191, 11, 111], [192, 12, 111], [193, 12, 111], [194, 12, 111], [195, 12, 111], [197, 8, 114], [198, 8, 114], [199, 9, 114], [200, 9, 114], [201, 9, 113], [202, 6, 112], [203, 5, 116], [204, 5, 116], [205, 5, 116], [206, 5, 116], [207, 5, 116], [208, 5, 116], [209, 5, 116], [210, 5, 116], [211, 3, 116], [212, 2, 119], [213, 3, 119], [214, 3, 119], [215, 3, 119], [216, 3, 119], [217, 3, 119], [218, 3, 119], [219, 3, 119], [220, 3, 119], [221, 3, 119], [222, 3, 119], [223, 3, 119], [224, 3, 119], [225, 3, 119], [226, 3, 119], [227, 3, 119], [228, 3, 119], [229, 3, 119], [230, 3, 119], [231, 3, 119], [232, 3, 119], [233, 3, 119], [234, 3, 119], [235, 3, 119], [236, 2, 119], [237, 3, 119], [238, 6, 116], [239, 7, 116], [240, 5, 116], [241, 5, 116], [242, 5, 116], [243, 5, 116], [244, 5, 116], [245, 5, 116], [246, 8, 113], [247, 8, 113], [248, 8, 113], [249, 8, 113], [250, 8, 110], [251, 11, 110], [252, 12, 110], [253, 11, 108], [254, 16, 105], [255, 16, 105], [256, 14, 105], [257, 17, 99], [258, 17, 99], [259, 17, 99], [260, 23, 96], [261, 23, 96], [262, 26, 86], [263, 26, 85], [264, 26, 85], [265, 37, 85], [266, 37, 85], [267, 37, 84]];
const ROW_BOUNDS = new Array(DISP_H).fill(null);
GLASS_ROWS.forEach(([r, l, ri]) => { ROW_BOUNDS[r] = [l, ri]; });

const NECK_ROW = 129;
const TOP_END   = 128;
const BOT_START = 130;
const BOT_END   = 267;

// Warm pixel-art tones. Physics is a section through the sand; the camera is
// head-on, outside the glass. Buried grains must not be drawn as exposed grains.
const SAND_COLORS = [
  [151, 108, 43], [172, 127, 48], [191, 146, 56], [207, 163, 66],
  [221, 179, 80], [231, 193, 100], [241, 207, 124], [250, 225, 156],
];
function projectSandFront(simulation) {
  const { cells, mask, width, firstRow, neckRow, lastRow } = simulation;
  const upperFace = new Uint8Array(cells.length);
  const topSurface = new Int16Array(width).fill(lastRow + 1);
  const bottomSurface = new Int16Array(width).fill(lastRow + 1);
  let remaining = 0;
  for (let i = firstRow * width; i < neckRow * width; i++) if (cells[i]) remaining++;

  // A concave drain funnel lies BEHIND the near-side sand. Project an opaque
  // front silhouette from the remaining grain count, not the internal V-shaped
  // section. This is a 2D front-view approximation, not a 3D particle solver.
  for (let y = neckRow - 1; y >= firstRow && remaining; y--) {
    const [left, right] = simulation.bounds[y];
    const count = Math.min(remaining, right - left + 1);
    // Empty the middle of the surface row first, then recede toward the walls.
    // Keep the dip one grain deep so the buried drain funnel stays occluded.
    const gapStart = left + Math.ceil(count / 2);
    const gapEnd = right - Math.floor(count / 2);
    for (let x = left; x <= right; x++) {
      if (x >= gapStart && x <= gapEnd) continue;
      upperFace[y * width + x] = 1;
      topSurface[x] = y;
    }
    remaining -= count;
  }

  // Find the supported lower pile from the floor upward. A passing grain in
  // the stream must not establish a false pile surface high in the chamber.
  const supported = new Uint8Array(cells.length);
  for (let y = lastRow; y >= neckRow; y--) {
    const [left, right] = simulation.bounds[y];
    for (let x = left; x <= right; x++) {
      const index = y * width + x;
      const below = index + width;
      if (cells[index] && (!mask[below] || supported[below] || supported[below - 1] || supported[below + 1])) {
        supported[index] = 1;
        bottomSurface[x] = y;
      }
    }
  }
  return { upperFace, topSurface, bottomSurface };
}

function drawSand(simulation, topOffset, bottomOffset, scale, putPixel) {
  const { cells, width, neckRow, lastRow, grainSize = 1 } = simulation;
  const { upperFace, topSurface, bottomSurface } = projectSandFront(simulation);
  for (let y = simulation.firstRow; y <= lastRow; y++) {
    const [left, right] = simulation.bounds[y];
    const upper = y < neckRow;
    const surface = upper ? topSurface : bottomSurface;
    const center = upper ? 70 : 198;
    const offset = upper ? topOffset : bottomOffset;
    const yOut = Math.round(center + (y * grainSize - center) * scale) + offset;
    for (let x = left; x <= right; x++) {
      const index = y * width + x;
      const face = upper ? upperFace[index] : y >= bottomSurface[x];
      const falling = !upper && !face && cells[index];
      if (!face && !falling) continue;
      // The face texture belongs to the visible facade, not to moving grains
      // inside the section. Otherwise the hidden core reads as a conveyor belt
      // against the glass. Only exposed falling grains carry their own tones.
      const noise = simulation.noise(index);
      const tone = falling ? cells[index] : noise < 0.12 ? 1 : noise > 0.9 ? 5 : noise > 0.6 ? 4 : 3;
      const depth = Math.max(0, y * grainSize - (upper ? 20 : 180));
      const shade = 4.4 - Math.min(depth / 120, 1.2) - (x * grainSize - CX) / 100;
      const rim = face && y === surface[x] ? 0.8 : 0;
      const color = falling ? 5 + tone % 3 : Math.round(shade + (tone - 3) * 0.65 + rim);
      for (let dy = 0; dy < grainSize; dy++) {
        for (let dx = 0; dx < grainSize; dx++) {
          putPixel(x * grainSize + dx, yOut + dy, SAND_COLORS[Math.max(0, Math.min(7, color))]);
        }
      }
    }
  }
  return [topSurface.map(y => y * grainSize), bottomSurface.map(y => y * grainSize)];
}

const FONT = [
  [0b111,0b101,0b101,0b101,0b111],
  [0b010,0b110,0b010,0b010,0b111],
  [0b111,0b001,0b111,0b100,0b111],
  [0b111,0b001,0b111,0b001,0b111],
  [0b101,0b101,0b111,0b001,0b001],
  [0b111,0b100,0b111,0b001,0b111],
  [0b111,0b100,0b111,0b101,0b111],
  [0b111,0b001,0b011,0b010,0b010],
  [0b111,0b101,0b111,0b101,0b111],
  [0b111,0b101,0b111,0b001,0b111],
];

// Glass images are loaded from pause-frames.js: GLASS_A, GLASS_B, PAUSE_FRAMES_A, PAUSE_FRAMES_B

// Pause animation offsets: [topOffset, bottomOffset, scale] for each frame
// 0=F1 default, 1=F2 condensed+scaled, 2=F1 default, 3=F3 expanded, 4=F4 expanded, 5=F5 transitioning back
const PAUSE_OFFSETS = [[0, 0, 1.0], [5, 0, 0.90], [0, 0, 1.0], [-9, 9, 1.0], [-9, 9, 1.0], [0, 0, 1.0]];
const DEBUG_GREEN = [0, 255, 0];
const DEBUG_RED = [255, 0, 0];

function SandTimer() {
  const sandCanvasRef = useRef(null);
  const rotationRef = useRef(null);  // Rotation container
  const glassRef   = useRef(null);
  const glassRefB  = useRef(null);
  const pauseFramesRef = useRef(PAUSE_FRAMES_A.map(src => {
    const img = new Image(); img.src = src; return img;
  }));
  const pauseFramesBRef = useRef(PAUSE_FRAMES_B.map(src => {
    const img = new Image(); img.src = src; return img;
  }));
  const accumRef   = useRef(0);
  const lastTsRef  = useRef(null);
  const pausedRef  = useRef(true);
  const resettingRef = useRef(false);
  const [paused, setPaused] = useState(true);
  const [unpausing, setUnpausing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  // Hourglass orientation: 'A' (default) or 'B' (after timer-complete reset)
  const [orientation, setOrientation] = useState('A');
  const [rotation, setRotation] = useState(0);
  const [sandRotation, setSandRotation] = useState(0);
  const [rotationTransition, setRotationTransition] = useState('0.4s');
  const isFlipped = orientation === 'B';
  const [shakeAmount, setShakeAmount] = useState(10);
  const [timeLeft, setTimeLeft] = useState(TOTAL_GRAINS);
  const [pauseFrameDisplay, setPauseFrameDisplay] = useState(5);
  const pauseFrameRef = useRef(5);
  const [debugMode, setDebugMode] = useState(false);
  const debugModeRef = useRef(false);
  const slowModeRef = useRef(false);  // For slow pause/reset buttons
  const [showDebugLines, setShowDebugLines] = useState(false);
  const showDebugLinesRef = useRef(false);
  const [frozen, setFrozen] = useState(false);
  const [shouldShake, setShouldShake] = useState(true);
  const [shakeDuration, setShakeDuration] = useState(0.5);
  const timerCanvasRef = useRef(null);

  // Map indices to frame labels for display
  const indexToLabel = {0:1, 1:2, 2:1, 3:3, 4:4, 5:5};

  // Draw blocky timer on canvas
  useEffect(() => {
    const canvas = timerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const SCALE = 2;
    const m = Math.floor(timeLeft / 60);
    const s = Math.floor(timeLeft % 60);
    const col = [80, 60, 10];

    // Clear canvas
    ctx.fillStyle = "#c4b8a8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw each pixel
    const drawPixelDigit = (d, ox, oy) => {
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 3; c++) {
          if (FONT[d][r] & (4 >> c)) {
            ctx.fillRect(ox + c * SCALE, oy + r * SCALE, SCALE, SCALE);
          }
        }
      }
    };

    const charW = 3 * SCALE + 2;
    const colonW = SCALE + 2;
    const totalW = charW * 3 + colonW - 2; // 3 digits + colon, minus trailing space
    let x = Math.floor((canvas.width - totalW) / 2);

    drawPixelDigit(m, x, 0);
    x += charW;

    // Colon
    ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
    ctx.fillRect(x, 2 * SCALE, SCALE, SCALE);
    ctx.fillRect(x, 6 * SCALE, SCALE, SCALE);
    x += colonW;

    drawPixelDigit(Math.floor(s / 10), x, 0);
    x += charW;
    drawPixelDigit(s % 10, x, 0);
  }, [timeLeft]);

  // Cycle through pause frames when paused: 0→1→2→3→4→5 then hold on 5
  useEffect(() => {
    if (!paused || resettingRef.current || unpausing || frozen) return;
    const frameTime = slowModeRef.current ? 1000 : 100;
    setPauseFrameDisplay(indexToLabel[pauseFrameRef.current]);
    const interval = setInterval(() => {
      // Stop if resetting started
      if (resettingRef.current) {
        clearInterval(interval);
        return;
      }
      if (pauseFrameRef.current < 5) {
        pauseFrameRef.current = pauseFrameRef.current + 1;
        setPauseFrameDisplay(indexToLabel[pauseFrameRef.current]);
      } else {
        // Reached F5, reset slow mode
        slowModeRef.current = false;
      }
    }, frameTime);
    return () => clearInterval(interval);
  }, [paused, resetting, unpausing, frozen]);

  // Reverse animation when unpausing
  // Normal unpause: f5→f4→f2→f1 (indices 5→4→1→0)
  // Reset unpause (condensed): f5→f2→f1 (indices 5→1→0)
  const unpauseSequence = [5, 4, 1, 0];
  const unpauseResetSequence = [5, 1, 0];
  const unpauseStepRef = useRef(0);
  const unpauseForResetRef = useRef(false);
  useEffect(() => {
    if (!unpausing) return;
    const sequence = unpauseForResetRef.current ? unpauseResetSequence : unpauseSequence;
    const frameTime = slowModeRef.current ? 1000 : 100;
    unpauseStepRef.current = 0;
    pauseFrameRef.current = sequence[0];
    setPauseFrameDisplay(indexToLabel[sequence[0]]);
    const interval = setInterval(() => {
      unpauseStepRef.current++;
      if (unpauseStepRef.current < sequence.length) {
        pauseFrameRef.current = sequence[unpauseStepRef.current];
        setPauseFrameDisplay(indexToLabel[sequence[unpauseStepRef.current]]);
      } else {
        // Animation complete, actually unpause
        setUnpausing(false);
        unpauseForResetRef.current = false;
        pausedRef.current = false;
        setPaused(false);
        slowModeRef.current = false;
      }
    }, frameTime);
    return () => clearInterval(interval);
  }, [unpausing]);

  useEffect(() => {
    const canvas = sandCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    // Preload glass images (A and B orientation)
    const glassImg = new Image();
    glassImg.src = GLASS_A;
    glassRef.current = glassImg;

    const glassImgB = new Image();
    glassImgB.src = GLASS_B;
    glassRefB.current = glassImgB;

    const buf = new Uint8ClampedArray(DISP_W * DISP_H * 4);
    const imgData = new ImageData(buf, DISP_W, DISP_H);
    const simulation = SandPhysics.fromGlass({
      width: DISP_W, height: DISP_H, rows: GLASS_ROWS,
      neckRow: NECK_ROW, duration: TOTAL_GRAINS,
    });
    let rafId;

    const sp = (x, y, c) => {
      if (x < 0 || x >= DISP_W || y < 0 || y >= DISP_H) return;
      const i = (y * DISP_W + x) << 2;
      buf[i]=c[0]; buf[i+1]=c[1]; buf[i+2]=c[2]; buf[i+3]=255;
    };
    const frame = (ts) => {
      if (lastTsRef.current !== null && !pausedRef.current)
        accumRef.current += (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      const elapsed = Math.min(accumRef.current, TOTAL_GRAINS);
      simulation.advance(elapsed);

      // Fill background
      for (let i=0; i<buf.length; i+=4) {
        buf[i]=196; buf[i+1]=184; buf[i+2]=168; buf[i+3]=255;
      }

      // Get pause animation offsets and scale
      const [topOff, botOff, scale] = pausedRef.current || (resettingRef.current && pauseFrameRef.current > 0)
        ? PAUSE_OFFSETS[pauseFrameRef.current] || [0, 0, 1.0]
        : [0, 0, 1.0];
      const topCenter = 70;  // center of top bulb
      const botCenter = 198; // center of bottom bulb

      const [topSurface, bottomSurface] = drawSand(simulation, topOff, botOff, scale, sp);

      // ── Debug: boundary strokes (red=top, green=bottom) ─────────────────────
      if (showDebugLinesRef.current) {
        const topSandRow = Math.min(...topSurface);
        const botSandRow = Math.min(...bottomSurface);
        // Top sand top boundary (transformed topSandRow)
        const topTopY = Math.round(topCenter + (topSandRow - topCenter) * scale) + topOff;
        for (let x = 0; x < DISP_W; x++) sp(x, topTopY, DEBUG_RED);
        // Top sand bottom boundary (transformed TOP_END)
        const topBotY = Math.round(topCenter + (TOP_END - topCenter) * scale) + topOff;
        for (let x = 0; x < DISP_W; x++) sp(x, topBotY, DEBUG_RED);
        // Bottom sand top boundary (transformed botSandRow)
        const botTopY = Math.round(botCenter + (botSandRow - botCenter) * scale) + botOff;
        for (let x = 0; x < DISP_W; x++) sp(x, botTopY, DEBUG_GREEN);
        // Bottom sand bottom boundary (transformed BOT_END)
        const botBotY = Math.round(botCenter + (BOT_END - botCenter) * scale) + botOff;
        for (let x = 0; x < DISP_W; x++) sp(x, botBotY, DEBUG_GREEN);
      }

      setTimeLeft(Math.max(0, TOTAL_GRAINS - elapsed));

      // Blit sand to canvas (glass is now a separate DOM element)
      ctx.putImageData(imgData, 0, 0);

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handlePause = () => {
    setFrozen(false);
    pauseFrameRef.current = 0;
    pausedRef.current = true;
    setPaused(true);
  };

  const handlePlay = () => {
    setHasStarted(true);
    setUnpausing(true);
  };

  const handleSlowPause = () => {
    slowModeRef.current = true;
    handlePause();
  };

  const handleSlowPlay = () => {
    slowModeRef.current = true;
    handlePlay();
  };

  const handleSlowReset = () => {
    slowModeRef.current = true;
    handleReset();
  };

  const doReset = () => {
    const dir = Math.random() < 0.5 ? -180 : 180;
    const timerDone = accumRef.current >= TOTAL_GRAINS;
    const wasFromPaused = pausedRef.current;

    // Ensure we start from 0 rotation to avoid extra spins
    setRotation(0);
    setSandRotation(0);

    // Only reset frame if not coming from paused (frame sequence runs in parallel)
    if (!wasFromPaused) {
      pauseFrameRef.current = 0;
    }
    resettingRef.current = true;
    setResetting(true);

    if (timerDone) {
      // Timer ran out: smooth 180° rotation using manual JS animation
      // Swap happens exactly at 90° midpoint for invisible transition
      setShouldShake(false);
      const totalTime = slowModeRef.current ? 2000 : 400;
      const dir = Math.random() < 0.5 ? -1 : 1;

      // Pause timer during reset animation
      pausedRef.current = true;

      setRotationTransition('none');

      let startTime = null;
      let swapped = false;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / totalTime, 1);

        // Ease in-out
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Calculate current angle (0 to 180)
        const angle = eased * 180 * dir;
        const absAngle = Math.abs(angle);

        // At 90°: swap BOTH glass and sand together
        if (absAngle >= 90 && !swapped) {
          swapped = true;
          setOrientation(o => o === 'A' ? 'B' : 'A');
          accumRef.current = 0;
          lastTsRef.current = null;
        }

        // Both use same rotation (with swap trick)
        if (!swapped) {
          setRotation(angle);
          setSandRotation(angle);
        } else {
          const swappedAngle = angle - (180 * dir);
          setRotation(swappedAngle);
          setSandRotation(swappedAngle);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete - both at 0° from swap trick
          setRotation(0);
          setSandRotation(0);
          setRotationTransition('0.4s');
          resettingRef.current = false;
          setResetting(false);
          pausedRef.current = false;
          setPaused(false);
          slowModeRef.current = false;
        }
      };

      requestAnimationFrame(animate);
    } else {
      // Timer still running: shake animation with double flip (stays in same orientation)
      const timeScale = slowModeRef.current ? 5 : 1; // 5x slower in slow mode
      const transitionTime = slowModeRef.current ? '2s' : '0.4s';

      // Pause timer during reset animation
      pausedRef.current = true;

      setShouldShake(true);
      setShakeAmount(Math.floor(Math.random() * 11) + 5); // 5-15px
      setShakeDuration(0.5 * timeScale);
      setRotationTransition(transitionTime);
      setRotation(r => r + dir);
      setSandRotation(r => r + dir);

      // Reset sand after third shake movement
      setTimeout(() => {
        accumRef.current = 0;
        lastTsRef.current = null;
      }, 400 * timeScale);

      // Flip again (random direction) so full sand is on top
      setTimeout(() => {
        setResetting(false);
        const dir2 = Math.random() < 0.5 ? -180 : 180;
        setRotation(r => r + dir2);
        setSandRotation(r => r + dir2);
      }, 900 * timeScale);

      // End animation and normalize rotations (100ms delay after rotation stops)
      setTimeout(() => {
        setRotationTransition('none');
        // Normalize rotation to 0 (double flip = visually same)
        setRotation(0);
        setSandRotation(0);
        requestAnimationFrame(() => {
          setRotationTransition('0.4s');
        });
        resettingRef.current = false;
        pausedRef.current = false;
        setPaused(false);
        slowModeRef.current = false;
      }, 1400 * timeScale);
    }
  };

  const handleReset = () => {
    if (resetting || unpausing) return;

    if (pausedRef.current) {
      // Run unpause frames AND reset rotation simultaneously
      const frameTime = slowModeRef.current ? 1000 : 100;
      const sequence = unpauseResetSequence; // [5, 1, 0] = F5→F2→F1
      let step = 0;

      // Start frame sequence
      pauseFrameRef.current = sequence[0];
      setPauseFrameDisplay(indexToLabel[sequence[0]]);

      const frameInterval = setInterval(() => {
        step++;
        if (step < sequence.length) {
          pauseFrameRef.current = sequence[step];
          setPauseFrameDisplay(indexToLabel[sequence[step]]);
        } else {
          clearInterval(frameInterval);
        }
      }, frameTime);

      // Start reset rotation immediately (doReset checks pausedRef before we clear it)
      doReset();

      // Clear paused UI state (pausedRef stays true until animation completes)
      setPaused(false);
    } else {
      // If not paused, just reset
      doReset();
    }
  };

  const btnStyle = {
    background: "#d4a020",
    border: "none",
    borderBottom: "4px solid #a07810",
    borderRight: "4px solid #a07810",
    borderTop: "4px solid #f0c848",
    borderLeft: "4px solid #f0c848",
    color: "#503808",
    height: 48,
    flex: 1,
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "bold",
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: 2,
  };

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "#c4b8a8", userSelect: "none",
      }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateY(0); }
          20% { transform: translateY(-${shakeAmount}px); }
          40% { transform: translateY(${shakeAmount}px); }
          60% { transform: translateY(-${shakeAmount}px); }
          80% { transform: translateY(${shakeAmount}px); }
        }
      `}</style>
      {/* Outer: shake animation */}
      <div
        onClick={() => {
          if (unpausing || resetting) return;
          if (timeLeft <= 0) {
            handleReset();
          } else {
            paused ? handlePlay() : handlePause();
          }
        }}
        style={{
          animation: resetting && shouldShake ? `shake ${shakeDuration}s ease-in-out ${shakeDuration * 0.3}s` : "none",
          position: "relative",
          width: DISP_W,
          height: DISP_H,
          cursor: unpausing || resetting ? "default" : "pointer",
        }}
      >
        {/* Sand: own rotation (full 180°, no swap) */}
        <canvas
          ref={sandCanvasRef}
          width={DISP_W}
          height={DISP_H}
          style={{
            position: "absolute",
            imageRendering: "pixelated",
            transform: `rotate(${sandRotation}deg)`,
            transition: rotationTransition === 'none' ? 'none' : `transform ${rotationTransition} ease-in-out`,
          }}
        />
        {/* Glass: rotation with swap trick */}
        <div
          ref={rotationRef}
          style={{
            position: "absolute",
            width: DISP_W,
            height: DISP_H,
            transform: `rotate(${rotation}deg)`,
            transition: rotationTransition === 'none' ? 'none' : `transform ${rotationTransition} ease-in-out`,
          }}
        >
          {/* Glass A */}
          <img
            key={`glass-A-${pauseFrameDisplay}`}
            src={pauseFrameDisplay > 1 && !isFlipped
              ? (pauseFramesRef.current[pauseFrameRef.current]?.src || GLASS_A)
              : GLASS_A}
            style={{
              position: "absolute",
              width: DISP_W,
              height: DISP_H,
              imageRendering: "pixelated",
              opacity: isFlipped ? 0 : 1,
            }}
          />
          {/* Glass B */}
          <img
            key={`glass-B-${pauseFrameDisplay}`}
            src={pauseFrameDisplay > 1 && isFlipped
              ? (pauseFramesBRef.current[pauseFrameRef.current]?.src || GLASS_B)
              : GLASS_B}
            style={{
              position: "absolute",
              width: DISP_W,
              height: DISP_H,
              imageRendering: "pixelated",
              opacity: isFlipped ? 1 : 0,
            }}
          />
        </div>
      </div>
      <canvas
        ref={timerCanvasRef}
        width={32}
        height={10}
        style={{
          marginTop: 45,
          width: 128,
          height: 40,
          imageRendering: "pixelated",
        }}
      />
      <div style={{ display: "flex", gap: 20, marginTop: 40, padding: "0 20px", width: "100%", maxWidth: 600, boxSizing: "border-box" }}>
        {!hasStarted ? (
          <button
            onClick={handlePlay}
            disabled={unpausing || resetting}
            style={btnStyle}
          >
            Start
          </button>
        ) : (
          <>
            <button
              onClick={paused ? handlePlay : handlePause}
              disabled={unpausing || resetting}
              style={btnStyle}
            >
              {paused ? "Play" : "Pause"}
            </button>
            <button
              onClick={handleReset}
              disabled={unpausing || resetting}
              style={btnStyle}
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
