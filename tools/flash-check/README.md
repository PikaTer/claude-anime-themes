# flash-check

The Claude desktop app holds a backdrop still, until its next redraw, once part
of it flashes: a guard against photosensitive seizures. When Ina's scene trips
it, a show freezes partway and the scene stays frozen after it. This plays
every scene Ina's theme draws in a headless Chrome and says whether any would
trip it.

Run it after any change to how Ina's scene moves: shows, wakes, dozing off,
tentacles, takodachis.

```bash
node tools/flash-check/check.mjs --control
```

```bash
node tools/flash-check/check.mjs --control --sizes all
```

- `--control` first plays a scene from before the guard was respected
  (`e0fe147~1`), which must trip. If it does not, the checker has drifted from
  the app and a pass means nothing.
- `--sizes` is `1280x800` by default; `all` is 900x650, 1100x720, 1280x800
  and 1680x1000.
- `--only zoltraak,doze` plays only cases whose names contain those words.
- `--reps 3` plays each case three times: the jittered grid differs each time.
- `--theme <dir>` checks another copy of the theme (a folder with `scene.js`).

It exits 1 if anything trips, or if the control does not.

## What counts as a flash

The rule was observed in the app's own code. It is not documented and may
change; `detector.js` is a reimplementation of it, not the app's code.

- A spot flashes once its brightness swings between light and dark four times
  within a second, each swing at least 0.1 in relative luminance with the
  darker end under 0.8. Saturated red swings count on their own.
- The guard trips once flashing spots cover more than a quarter of any patch
  of the window about 341 x 256 px. Every layer over the same spot counts
  together, and moving a big sprite fast counts too: its edges swap light and
  dark.

So keep big, bright changes slower than about two swings a second: turning
parts at about 0.8 s a frame, one faint window flash per show, single hops and
recoils rather than shakes.

## Needs

Node 20 or later, and `playwright-core` with a Chrome:

```bash
npx -y playwright-core install chromium
```

It finds `playwright-core` installed, in npx's cache, or at `PLAYWRIGHT_CORE`.
For Chrome, pass `--chrome <path>` or set `CHROME`; otherwise it uses
Playwright's Chromium, then an installed Google Chrome.

## Files

- `check.mjs`: the command. Serves the page, plays the cases, prints a line each.
- `cases.mjs`: the scenes, drawn by the theme's `scene.js` as the app would
  draw them at one window size: every wake, every show with 0, 3 and 8
  takodachis, dozing off, and shows redrawn partway by joins, leaves and the
  turn ending.
- `page.html`: shows each scene as the app would, samples it every frame and
  feeds the detector.
- `detector.js`: the flash rule.
