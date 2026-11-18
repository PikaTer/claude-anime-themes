# Held Takodachi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the theme loads, each of Ina's two corner tentacles is rolled on its own to wrap a takodachi (B), carry one (C), or stay empty as today.

**Architecture:** The tentacle art moves out of `scene.js` into a new `held.js`, which owns the roll (`rollHold`) and draws both tentacles for a given hold (`tentacles`). `scene.js` rolls once at module load (`HOLD`, like the marks' shuffle) and `draw` takes an optional third argument `hold` that defaults to it, so tests and the flash checker can force each look.

**Tech Stack:** Plain ES modules producing SVG strings. Tests in `plugins/anime-themes/hooks/register.test.tsx`, run with `claude plugin test plugins/anime-themes`. Flash check: `node tools/flash-check/check.mjs --control --sizes all`.

**Spec:** `docs/superpowers/specs/2026-11-19-held-takodachi-design.md`

## Global Constraints

- Roll per tentacle, high first then low, one `random()` each: `< 0.25` → `'wrap'`, `< 0.5` → `'ride'`, else `'none'`.
- Wrap (B): the tentacle's own curve (`curls(0.4, 7)` low, length 110; `curls(0.35, 8)` high, length 70) up to step `i0` (62 low, 36 high), then a circle of radius 10.5 for `round(10.5 * 5.4)` more steps. The takodachi is centred on the circle's centre at `scale(.8)` (4 px pixels), drawn **under** the tentacle.
- Ride (C): tentacle art unchanged, takodachi at full scale (5 px pixels). Low: sits on the arch, top-left at `translate(-54 -72)`, drawn **over** the tentacle. High: hangs under the arch, top-left at `translate(-39 28)`, with raised arms `px(['TT','TT','oo'], 6, 1) + px(['TT','TT','oo'], 16, 1)`, drawn **under** the tentacle.
- All translates are whole numbers in Ina's units.
- The held takodachi is `<use href="#tako"/>` inside `<g class="hold">`, so the tests' `count(svg, '<use href="#tako"/>')` still counts it. Existing tests that count takodachis pass `NONE` (below).
- It bobs (the existing `class="on"` + `class="bob"` wrap) only while Ina is `wake` or `work`. Asleep, waiting or dozing it holds still, like the marks. (Builder's call: the spec said "bobs like the others", and the others only exist while she works.)
- With cat Ina out it carries `<use href="#cear"/>`, and `TAKO_EARS` goes in the defs.
- Size: every SVG under 131,072 characters with `hold = { high: 'wrap', low: 'wrap' }`. Today's worst case measures about 129,200 (marks are random, give or take a few hundred), and both wraps add about 1.4 KB.
- Flash guard: no new motion beyond the existing 1 px `bob` step.

## Review Focus

- **Asleep at load.** The roll is visible from the first, sleeping frame. Expect the held takodachi drawn and still. Pinned in Task 2.
- **Subagents joining.** A held takodachi must not count as a subagent's, and must not take a left-side cell, WAH, or show part. Pinned in Task 2 (count with a crowd).
- **Cat Ina with no eared subagents.** The ears' defs must still be emitted for the held ones. Pinned in Task 2.
- **Worst-case size, both wrapped.** Every existing size assertion is rerun with both wrapped. Task 3.
- **Phone width.** `.ina-s` drops to `scale(3)` under 700 px. The held takodachi sits inside `.ina-s`, so it scales with the tentacle with no extra rule. Checked by eye in Task 4.

---

### Task 1: `held.js`: the roll and the tentacle art

**Files:**
- Create: `plugins/anime-themes/hooks/themes/ina-pixel-dark/held.js`
- Create: `plugins/anime-themes/hooks/themes/ina-pixel-dark/held.d.ts`
- Test: `plugins/anime-themes/hooks/register.test.tsx`

**Interfaces:**
- Produces:
  - `type Grip = 'none' | 'wrap' | 'ride'`
  - `type Hold = { high: Grip; low: Grip }`
  - `rollHold(random?: () => number): Hold` (defaults to `Math.random`)
  - `tentacles(hold: Hold, how?: { awake?: boolean; ears?: boolean }): { high: string; low: string }`. Markup in Ina's units, the root at the same place as today's `TENTACLE_HIGH` / `TENTACLE_LOW`: `px(rows, -root - 7, -rows.length)` low, `px(rows.toReversed(), -root - 7, 0)` high.

- [ ] **Step 1: Write the failing tests**

```ts
import { rollHold, tentacles } from './themes/ina-pixel-dark/held.js'
const NONE = { high: 'none', low: 'none' } as const

test('each tentacle is rolled on its own: a quarter wrap, a quarter ride', () => {
  const seq = (...xs: number[]) => () => xs.shift() ?? 0.9
  expect(rollHold(seq(0.1, 0.3))).toEqual({ high: 'wrap', low: 'ride' })
  expect(rollHold(seq(0.6, 0.24))).toEqual({ high: 'none', low: 'wrap' })
  const rolls = Array.from({ length: 4000 }, () => rollHold())
  for (const grip of ['wrap', 'ride'] as const) {
    const share = rolls.filter(r => r.high === grip).length / 4000
    expect(share).toBeGreaterThan(0.21); expect(share).toBeLessThan(0.29)
  }
})

test('a wrapped tentacle curls round its takodachi; a ridden one is unchanged', () => {
  const bare = tentacles(NONE)
  const ride = tentacles({ high: 'ride', low: 'ride' })
  const wrap = tentacles({ high: 'wrap', low: 'wrap' })
  expect(bare.high).not.toContain('class="hold"')
  expect(ride.high).toContain(bare.high); expect(ride.low).toContain(bare.low)
  expect(wrap.high).not.toContain(bare.high); expect(wrap.low).not.toContain(bare.low)
  for (const part of [ride.high, ride.low, wrap.high, wrap.low]) expect(count(part, 'class="hold"')).toBe(1)
  expect(wrap.low).toContain('scale(.8)')
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `claude plugin test plugins/anime-themes`
Expected: FAIL, `held.js` not found.

- [ ] **Step 3: Implement `rollHold` and `tentacles` in `held.js`**

Move `low`, `high`, `TENTACLE_LOW` and `TENTACLE_HIGH` here from `scene.js:299-302`. A wrapped tentacle is `tentacle(len, bend)` with `bend = t => (i = t * len) < i0 ? curls(...)(i / L) : curls(...)(i0 / L) + (i - i0) / R`. The takodachi's centre is the spine point at `i0` plus `R` along `heading - π/2`. Walk the spine with the same steps as `tentacle()` in `pixels.js`. Then shift by `-7` in x, and for low by `-1` in y; for high, negate y. Snap the translate to whole numbers. Compute all four arts once at module load: `tentacles` only picks among them and wraps the takodachi as the constraints say. `held.d.ts` declares the interface above.

- [ ] **Step 4: Run the tests to see them pass**

Run: `claude plugin test plugins/anime-themes`
Expected: the two new tests PASS. The rest are unchanged, since `scene.js` doesn't use `held.js` yet.

- [ ] **Step 5: Commit**

```bash
git add plugins/anime-themes/hooks/themes/ina-pixel-dark/held.js plugins/anime-themes/hooks/themes/ina-pixel-dark/held.d.ts plugins/anime-themes/hooks/register.test.tsx
git commit -m "Draw Ina's tentacles wrapping or carrying a takodachi"
```

### Task 2: `draw` holds what was rolled at load

**Files:**
- Modify: `plugins/anime-themes/hooks/themes/ina-pixel-dark/scene.js` (tentacle constants at 299-302, the two tentacle `<svg>`s and defs in `draw`, 742-747)
- Modify: `plugins/anime-themes/hooks/themes/ina-pixel-dark/scene.d.ts`
- Test: `plugins/anime-themes/hooks/register.test.tsx`

**Interfaces:**
- Consumes: `rollHold`, `tentacles`, `Hold` from Task 1.
- Produces: `export const HOLD: Hold` (rolled once at module load), `draw(scene: Scene, insets?: Insets, hold?: Hold): string` (`hold` defaults to `HOLD`).

- [ ] **Step 1: Write the failing tests**

```ts
const WRAP = { high: 'wrap', low: 'wrap' } as const
test('the tentacles hold what was rolled when the theme loaded, and nothing else changes', () => {
  expect(draw(ASLEEP)).toBe(draw(ASLEEP, undefined, HOLD))
  const crowd = ['a1', 'a2', 'a3'].reduce(join, { ...wake(ASLEEP, 't'), ina: 'work' as const })
  expect(count(draw(crowd, undefined, WRAP), 'class="hold"')).toBe(2)
  expect(count(draw(crowd, undefined, { high: 'ride', low: 'none' }), 'class="hold"')).toBe(1)
  expect(count(draw(crowd, undefined, NONE), 'class="hold"')).toBe(0)
  // Not a subagent's: the left-side takodachis and their WAHs are as with none held.
  expect(count(draw(crowd, undefined, WRAP), TAKO)).toBe(crowd.takos.length + 2)
  expect(count(draw(crowd, undefined, WRAP), ECHO)).toBe(count(draw(crowd, undefined, NONE), ECHO))
})

test('held takodachis bob while Ina is up, hold still asleep, and wear cat ears with cat Ina', () => {
  const held = (svg: string) => svg.slice(svg.indexOf('class="hold"'), svg.indexOf('class="hold"') + 400)
  expect(held(draw(ASLEEP, undefined, WRAP))).not.toContain('class="bob"')
  expect(held(draw({ ...wake(ASLEEP, 't'), ina: 'work' }, undefined, WRAP))).toContain('class="bob"')
  const cat = draw({ ...wake(ASLEEP, CAT), ina: 'work' }, undefined, WRAP)
  expect(cat).toContain('id="cear"'); expect(count(cat, '<use href="#cear"/>')).toBe(2)
  expect(draw({ ...wake(ASLEEP, 't'), ina: 'work' }, undefined, WRAP)).not.toContain('#cear')
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `claude plugin test plugins/anime-themes`
Expected: FAIL, `HOLD` not exported and no `class="hold"`.

- [ ] **Step 3: Use `held.js` in `draw`**

Replace `TENTACLE_HIGH` and `TENTACLE_LOW` in `draw` with `tentacles(hold, { awake: working(scene), ears: scene.form === 'cat' })`. Emit `TAKO_EARS` when `scene.takos.some(t => t.ears) || (scene.form === 'cat' && (hold.high !== 'none' || hold.low !== 'none'))`. `HOLD = rollHold()` sits beside `STARS`. Update `scene.d.ts`'s `draw` signature and export `HOLD`. Re-export `Hold`/`Grip` types from `held.d.ts`. Make every existing test that counts `TAKO` or matches whole SVGs pass `NONE` as the third argument, so a lucky roll can't break them.

- [ ] **Step 4: Run the tests to see them pass**

Run: `claude plugin test plugins/anime-themes`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/anime-themes/hooks/themes/ina-pixel-dark/scene.js plugins/anime-themes/hooks/themes/ina-pixel-dark/scene.d.ts plugins/anime-themes/hooks/register.test.tsx
git commit -m "Roll Ina's tentacles a takodachi to hold when the theme loads"
```

### Task 3: Size and flashes with both held

**Files:**
- Modify: `plugins/anime-themes/hooks/register.test.tsx` (size assertions at about 148, 156, 166, 845, 853)
- Modify: `tools/flash-check/cases.mjs`

- [ ] **Step 1: Pass `WRAP` to every `draw` whose `.length` is checked against 131072**

Run: `claude plugin test plugins/anime-themes`
Expected: PASS. If one fails, measure by how much. Then trim inside `held.js` only: draw the wrapped tentacles with colours `'uUu'`, so the sucker spots merge into the body's runs. If that's still not enough, stop and tell the user. Rerun until it passes with at least 200 characters to spare over five runs (the marks are random).

- [ ] **Step 2: Add flash cases**

In `cases.mjs`, let `sized(scene, hold)` pass `hold` as `draw`'s third argument. The control's older `draw` ignores it. Add `still('held-wrap-work', at('nerd', false, 3), WRAP)`, `still('held-ride-cat', at('cat', false, 0), RIDE)` and `still('held-wrap-trophy', show(at('nerd', false, 3), 'trophy'), WRAP)`.

Run: `node tools/flash-check/check.mjs --control --sizes all`
Expected: the control trips, nothing else does, exit 0.

- [ ] **Step 3: Commit**

```bash
git add plugins/anime-themes/hooks/register.test.tsx tools/flash-check/cases.mjs
git commit -m "Check the scene's size and flashes with both tentacles holding a takodachi"
```

### Task 4: Look at it

- [ ] **Step 1: Render `draw` at 1680×1000, 1280×800 and 375×812 for `WRAP`, `{ high: 'ride', low: 'ride' }` and `{ high: 'wrap', low: 'ride' }`, and compare with the approved mockups (B and C).** At the phone width, the held takodachi should scale with its tentacle.
- [ ] **Step 2: Send the screenshots to the user.**
