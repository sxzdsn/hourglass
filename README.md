About:
This is my first vibecoded project with claude code and codex, nanobanana for assets. Simple little project to play to see what we can do now with this new technology.

I've been weirdly missing the messy old school design prototyping (<2024) method of linking up static frames together with blue spaghetti. Mapping out png sequences comes pretty close:







--------------------------------------------
Codex Generated notes below:

# Hourglass

A two-minute pixel-art sand timer with cellular-automaton sand physics.

**[Open the live GitHub Pages site](https://sxzdsn.github.io/hourglass/)**

## Sand and controls

- Chunky 3×3-pixel grains are the default. Use [2×2 grains](https://sxzdsn.github.io/hourglass/?grain=2) for comparison.
- Pause stops the timer and new grains at the neck; grains already falling finish landing.
- The upper sand has subtle surface-texture movement, concentrated near the mouth, while internal flow stays hidden.
- Click the hourglass or use the buttons to play, pause, and reset.

## Run locally

From the repository directory:

```sh
python3 -m http.server 4000 --bind 127.0.0.1
```

Open [localhost:4000](http://127.0.0.1:4000/). No build step is required; the page loads React and Babel from a CDN.

## Tests

With Node.js installed:

```sh
node --test sand-physics.test.js
```

Tests cover grain conservation, settling, pause/resume, reset, pixel rendering, and front-surface motion.

## Publishing

GitHub Pages publishes the repository root from `main` to the live site linked above.

When changing cached assets, bump the cache version in `sw.js`. Keep the physics and renderer URL versions synchronized in `index.html` and the service worker's asset list so browsers load compatible files. An existing tab may need another reload after its service worker updates.

The unfinished Margolus experiment in `experiments/` is preserved for reference and is not loaded by the app.
