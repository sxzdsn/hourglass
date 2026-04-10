# Sand Timer App

Pixel-art hourglass timer built with React (browser globals, no bundler) and HTML5 Canvas.

## Architecture

- **Glass**: Two pre-rendered images (A and B orientations) in `pause-frames.js`
- **Sand**: Drawn on canvas every frame based on `accumRef.current` (0 = top, 120 = bottom)
- **Rotation**: CSS transforms on separate DOM elements

## The Swap Trick

When rotating 180°, we use a "swap trick" at 90° to avoid accumulating rotation:
- 0° → 90°: rotate normally
- At 90°: swap image A→B (they look identical at 90°) and flip rotation to -90°
- -90° → 0°: continue rotating

This makes a visual 180° rotation while ending at 0°.

## Current Version (sand-timer.jsx)

Glass AND sand swap together at 90°:
- Glass: A@90° → B@-90°
- Sand: bottom@90° → top@-90° (accumRef resets at swap)
- Both use same rotation value

## Shelved Version (sand-timer-new.jsx)

Independent animations:
- Glass: swap trick at 90°
- Sand: full 180° rotation, atomic swap at END via direct DOM manipulation
- `sandCanvasRef.current.style.transform` bypasses React state for atomic update

## Key Files

- `sand-timer.jsx` — main component (current: swap-together version)
- `sand-timer-new.jsx` — shelved independent-animations version
- `pause-frames.js` — glass images (GLASS_A, GLASS_B, PAUSE_FRAMES_A, PAUSE_FRAMES_B)
- `index.html` / `index-new.html` — entry points for each version

## Debug Mode

Toggle with DBG button (top-left). Features:
- F1-F5 buttons: freeze on specific pause animation frames
- Skip to 0:30 / 0:00: jump timer forward
- Lines: toggle red/green sand boundary visualization
- Slow Pause/Play/Reset: 5x slower animations for debugging

## State Variables

- `accumRef`: elapsed seconds (0-120), determines sand position
- `orientation`: 'A' or 'B' glass image
- `rotation` / `sandRotation`: current rotation degrees
- `pauseFrameRef`: current pause animation frame (0-5)
- `pausedRef` / `resettingRef`: animation state flags

## Known Issues

None currently.

## Recent Changes (2026-04-08)

### Hourglass Click Interaction
The hourglass itself is now clickable:
- **Mid-timer**: click to pause/unpause (same as Pause/Play button)
- **Timer complete**: click to reset (same as Reset button)
- Clicks ignored during animations (unpausing/resetting)
- Cursor changes to pointer when clickable

### Blocky Pixel Timer
The countdown display below the hourglass now renders as true blocky pixels:
- Uses a small canvas (32x10) scaled up 4x with `image-rendering: pixelated`
- Draws digits using the same `FONT` bitmap array as the in-glass timer
- `timerCanvasRef` + `useEffect` redraws on `timeLeft` change
