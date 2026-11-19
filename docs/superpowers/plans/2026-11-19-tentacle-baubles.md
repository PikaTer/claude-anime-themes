# Tentacle Baubles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In festive (Christmas) scenes, hang about 4 to 5 round baubles on each of Ina's two corner tentacles.

**Architecture:** Each bauble colour is one sprite in `<defs>` (`xmas.js`, joined to `XMAS_DEFS`); each placement is a `<use>` with an x and y. Placements are computed once at load in `held.js` from each tentacle's spine (the same walk `tentacle()` in `pixels.js` does, now exported as `spine()`), for the three arts a tentacle can have: bare, riding, wrapped. `tentacles(hold, { festive })` appends them to each tentacle's art.

**Tech Stack:** Plain ES modules (`.js` with `.d.ts`), the test file `plugins/anime-themes/hooks/register.test.tsx` (run with `claude plugin test plugins/anime-themes`), headless Chrome flash checker in `tools/flash-check`.

**Spec:** `docs/superpowers/specs/2026-11-19-tentacle-baubles-design.md` (parent: `docs/superpowers/specs/2026-11-19-christmas-ina-design.md`)

## Global Constraints

- Festive scenes only: `draw(scene, insets, hold, festive = true)`. A plain scene's markup must be byte-for-byte what it is today.
- Baubles are still: no animation, no CSS, no filters.
- Round, in red, gold, blue and silver, each with a highlight and a shaded side, on a small gold hook, hanging down the screen from the tentacle's lower edge. About 4 to 5 per tentacle (the high one, being shorter, nearer 4).
- Spacing about 14 spine steps; the first about 12 steps from the root. None on the tip or on a wrapped tentacle's loop.
- Nothing covers a held takodachi or its hat: baubles skip its box, and a riding takodachi on the low tentacle stays in front.
- The scene's worst case, festive and plain, stays under 131072 characters (`draw(...).length`), about 5 KB of headroom today.
- Nothing may trip `tools/flash-check`. Never copy code from the desktop app's bundle (public repo).
- Each bauble is a `<use>` of a sprite drawn once in `<defs>`; no per-bauble pixel paths.

## Review Focus

- A festive scene with the tentacles bare, riding and wrapping, in every pairing: baubles appear on each, never overlap the held takodachi's box.
- The worst-case festive scene (both tentacles wrapping, 14 takodachis in and 14 out) still fits the limit.
- A plain scene (festive false), and a festive one with no tentacle art, draw no `#bb` at all.
- The refactor of `tentacle()` onto `spine()` changes no tentacle's pixels.
- Cat Ina's festive scene (ears on a held takodachi) is unaffected.

---

### Task 1: Export the tentacle's spine

**Files:**
- Modify: `plugins/anime-themes/hooks/themes/ina-pixel-dark/pixels.js:154-186` (the `tentacle` function)
- Test: `plugins/anime-themes/hooks/register.test.tsx`

**Interfaces:**
- Produces: `export function spine(length: number, bend: (t: number) => number, thick = 4.2, tip = 1): { i: number; t: number; x: number; y: number; heading: number; thick: number }[]` — the walk `tentacle()` does today (one point per step `i` in `0..length-1`, `t = i / length`, `heading = -Math.PI / 2 - bend(t)`, `thick = (thick - tip) * (1 - t) + tip`, `x`/`y` the raw position before the grid shift). `tentacle()` calls it and its output must not change.

- [ ] **Step 1: Pin today's output.** Before touching `pixels.js`, compute a fingerprint of `tentacle(110, curls(0.4, 7))`, `tentacle(70, curls(0.35, 8))` and `tentacle(40, t => 3 * t)` (JSON of `{rows, root}`, hashed with `node:crypto` sha1) with a throwaway node script, and write the test `tentacle's pixels do not change with its spine exported` in `register.test.tsx` asserting those three hashes.
- [ ] **Step 2: Run it** (`claude plugin test plugins/anime-themes`): it passes against the unmodified code.
- [ ] **Step 3: Write the failing test** `spine walks the tentacle's curve`: `spine(110, curls(0.4, 7))` has length 110; first point is `{ i: 0, x: 0, y: 0 }` with `thick` 4.2; last point's `thick` is under 1.1; `y` strictly decreases through the first 20 points.
- [ ] **Step 4: Run it** and see it fail (`spine` not exported).
- [ ] **Step 5: Implement `spine`** in `pixels.js` by moving the walk out of `tentacle()`, which then calls `spine(length, bend, thick, tip)` and does the rest as before. Add its declaration to `pixels.d.ts` if one exists for the file (it has none today; skip if so).
- [ ] **Step 6: Run the whole suite**: both new tests and every existing one pass.
- [ ] **Step 7: Commit** `Export the tentacle's spine`.

### Task 2: The bauble sprites

**Files:**
- Modify: `plugins/anime-themes/hooks/themes/ina-pixel-dark/xmas.js` (add sprites, join to `XMAS_DEFS`), `plugins/anime-themes/hooks/themes/ina-pixel-dark/pixels.js` (palette: add letters only where an existing one doesn't fit the blue pair; blue base `#4a8fe0`, light `#b5defa`, shade `#2c5aa0`)
- Test: `plugins/anime-themes/hooks/register.test.tsx`

**Interfaces:**
- Produces: `export const BAUBLE_SIZE: [number, number]` (width, height of one sprite in pixels, hook included) and `export const BAUBLES: number` (4, the colours). `XMAS_DEFS` gains `<g id="bb0">` … `<g id="bb3">` — red, gold, blue, silver — each drawn with its origin at the sprite's top-left, so `<use href="#bbN" x y>` puts the sprite's top-left at `x y`. The hook's attach point is the sprite's top-centre pixel (column `Math.floor(width / 2)`, row 0).

- [ ] **Step 1: Write the failing test** `a festive scene defines four baubles once each`: `draw(scene, undefined, NONE, true)` contains each of `id="bb0"`…`id="bb3"` exactly once and `draw(scene, undefined, NONE)` (plain) contains none.
- [ ] **Step 2: Run it** and see it fail.
- [ ] **Step 3: Implement** the sprites from the mockup: a 5-wide grid, a 2-pixel gold hook and string on top (light then dark gold), a gold cap, then a rounded body 5 wide and 5 tall with the highlight top-left and the shade along the lower right. One grid per colour built from a shared template, via `px` (the sprites are tiny).
- [ ] **Step 4: Run the suite**: passes.
- [ ] **Step 5: Commit** `Add the Christmas bauble sprites`.

### Task 3: Place baubles along each tentacle

**Files:**
- Modify: `plugins/anime-themes/hooks/themes/ina-pixel-dark/held.js` (placements, `tentacles()`), `plugins/anime-themes/hooks/themes/ina-pixel-dark/held.d.ts` (only if a new export is added)
- Test: `plugins/anime-themes/hooks/register.test.tsx`

**Interfaces:**
- Consumes: `spine` (Task 1), `BAUBLE_SIZE`, `BAUBLES` (Task 2).
- Produces: `tentacles(hold, { festive: true })` returns each tentacle's markup with `<use href="#bbN" x="…" y="…"/>` elements added: after the tentacle's own art, and, where a takodachi rides on the low tentacle, before the takodachi (so it stays in front). Positions are in the same units and frame as the tentacle's art (relative to its corner anchor): a spine point `p` becomes `[Math.round(p.x) - 7, Math.round(p.y) - 1]` for the rising (low) one and `[Math.round(p.x) - 7, -Math.round(p.y)]` for the hanging (high) one. Colours cycle `bb0`…`bb3`.

- [ ] **Step 1: Write the failing tests**, each over `tentacles(hold, { festive: true })`, with a helper that parses `<use href="#bb(\d)" x="(-?\d+)" y="(-?\d+)"/>`:
  - `bare tentacles get four to five baubles each when festive, none when plain`: with `NONE`, `.low` has 4 to 6 and `.high` 3 to 5 baubles; with `festive` absent, neither has any.
  - `baubles hang from distinct, spaced places`: within one tentacle, no two baubles' boxes (`BAUBLE_SIZE` at x, y) overlap.
  - `a ridden or wrapped takodachi is left clear`: for `{high:'wrap', low:'wrap'}`, `{high:'ride', low:'ride'}` and `{high:'wrap', low:'ride'}` no bauble's box intersects the held takodachi's 24 × 20 box (its `translate` in the tentacle's `class="hold"` group; for a wrapped one, 24 × 20 centred where `hk` puts it).
  - `a wrapped tentacle has no bauble on its loop`: every bauble on a wrapped tentacle sits on the straight-ish stretch before the loop (its spine step is under `from`).
  - `a riding takodachi on the low tentacle stays in front of the baubles`: in `tentacles({high:'none', low:'ride'}, {festive:true}).low`, every `#bb` use comes before `class="hold"`.
- [ ] **Step 2: Run them** and see them fail.
- [ ] **Step 3: Implement** in `held.js`: `baublesFor(spine, {hang, from?, avoid?}): string` returning the `<use>`s: every 14 steps starting at step 12, over `t` between 0.07 and 0.86, on whichever edge faces down the screen (edge point = spine point ± `thick - 0.4` along the heading's perpendicular, as in the mockup), hook at that edge; for the wrapped arts only steps under `from`; dropping any whose box meets `avoid` (the held takodachi's box from `AT`). Precompute the `BAUBLES_*` strings for bare, ride and wrap of each tentacle once at module load, and add them in `tentacles()` when `festive` is set. Verify the placement by eye against the mockup (Task 5).
- [ ] **Step 4: Run the suite**: passes.
- [ ] **Step 5: Commit** `Hang baubles on Ina's tentacles in a festive scene`.

### Task 4: Size, flashes and docs

**Files:**
- Modify: `plugins/anime-themes/hooks/register.test.tsx` (the festive size test), `tools/flash-check/cases.mjs`, `README.md`, `docs/superpowers/specs/2026-11-19-christmas-ina-design.md`, `/Users/pikater/.claude/projects/-Users-pikater-Projects-claude-anime-themes/memory/scene-size-limit.md`
- Test: `plugins/anime-themes/hooks/register.test.tsx`

**Interfaces:**
- Consumes: `draw(..., hold, true)` from Task 3.

- [ ] **Step 1: Write the failing test** `festive tentacles hang baubles in a real scene, and a plain scene draws none`: `draw(crowd, undefined, NONE, true)` contains `#bb` between 6 and 12 times, with the baubles' sprites defined once; the same with `NONE` and `festive` false contains none.
- [ ] **Step 2: Run it**: passes if Task 3 is right; if not, fix there.
- [ ] **Step 3: Measure the worst case** festive and plain, by copying the scenario of the test `festive, every show still fits the limit…` (14 takodachis in, 14 out, both tentacles wrapping), and report the lengths. The existing assertion `< 131072 - 500` must still pass; if the baubles took more than the 5 KB headroom, cut spacing or baubles until it does.
- [ ] **Step 4: Add flash cases** to `tools/flash-check/cases.mjs`: `xmas-baubles-bare` (a festive working scene, `NONE`), `xmas-baubles-wrap` (`{high:'wrap', low:'wrap'}`) and `xmas-baubles-ride` (`{high:'ride', low:'ride'}`), each via `still(name, at('nerd', true, 3), hold, true)`. Run `node tools/flash-check/check.mjs --control --sizes all` (needs the cached headless shell: pass `--chrome <path>`); exit 0 means nothing trips.
- [ ] **Step 5: Docs.** Add a "Baubles on the tentacles" line to the Christmas spec's changes list, to the README's Christmas sentence ("…the tentacles carry baubles…"), and refresh the numbers and history in the `scene-size-limit` memory note with the measured worst case.
- [ ] **Step 6: Run the whole suite** and the flash check; both pass.
- [ ] **Step 7: Commit** `Check baubles' size and flashes, and write them up`.

### Task 5: Look at it

**Files:**
- Create (scratch only, not committed): a render script in the scratchpad.

- [ ] **Step 1:** Render `draw(scene, {left:0,right:0}, hold, true)` at 1280×800 for `NONE`, `{high:'wrap', low:'ride'}` and `{high:'ride', low:'wrap'}` (as `before.mjs` in the session scratchpad does) and look at each: baubles hang from the lower edge, are round and readable, and nothing covers a held takodachi or its hat.
- [ ] **Step 2:** Send the screenshots to the user with a line on what the three show, and fix anything that looks off before calling the work done.

---

## Self-review

- **Spec coverage:** festive-only (Tasks 3, 4); 4 to 5 baubles, colours, hook, round (Tasks 2, 3); bare/ride/wrap and skipping the loop and the takodachi (Task 3); still (constraint); no covering (Task 3 tests); size and flashes (Task 4); non-goals (no lights/twinkle) untouched.
- **Types:** `spine`, `BAUBLE_SIZE`, `BAUBLES` and the `bb0`…`bb3` ids are named once and used the same way later.
- **Proportion:** a small plan for a small change; no task carries more than the interfaces and tests decide.
