<!-- last reviewed: 2026-06-10 -->
# Hourglass / sand timer

Personal project — pixel-art hourglass timer. React (browser globals, no bundler) + HTML5 Canvas. Deployed as a PWA (manifest.json + sw.js), added to phone home screen.

## Architecture
- **Glass**: two pre-rendered images (A and B orientations) in `pause-frames.js`
- **Sand**: drawn on canvas every frame from `accumRef.current` (0 = top, 120 = bottom)
- **Rotation**: CSS transforms on separate DOM elements
- Pixel-art renderer: 66×152 virtual pixels scaled up; sand physics `h = H × sqrt(1-p)` for triangular volume; row-by-row dither tied to actual drain timing

## The swap trick
Rotating 180° without accumulating rotation: rotate 0°→90° normally; at 90° swap image A→B (identical at 90°) and flip rotation to -90°; continue -90°→0°. Visual 180°, ends at 0°. Current version (`sand-timer.jsx`): glass AND sand swap together at 90° (accumRef resets at swap).

## Interactions
- Tap hourglass mid-timer: pause/unpause; when complete: reset (clicks ignored during animations)
- Flip animation with shake
- Blocky pixel countdown below the glass: small canvas (32×10) scaled 4x with `image-rendering: pixelated`, drawn from the same `FONT` bitmap as the in-glass timer

## Key files
- `sand-timer.jsx` — main component (swap-together version)
- `pause-frames.js` — glass images (GLASS_A, GLASS_B, PAUSE_FRAMES_A/B)
- `index.html` — entry point; `manifest.json`, `sw.js` — PWA
- `archive/` — shelved independent-animations experiment (`sand-timer-new.jsx`, `index-new.html`, `sand-timer-current.jsx`)

## Debug mode
DBG button (top-left): F1–F5 freeze on pause frames; skip to 0:30/0:00; red/green sand boundary lines; 5x slower pause/play/reset animations.

## State variables
`accumRef` (elapsed 0–120s, sand position), `orientation` ('A'/'B'), `rotation`/`sandRotation`, `pauseFrameRef` (0–5), `pausedRef`/`resettingRef` flags.
