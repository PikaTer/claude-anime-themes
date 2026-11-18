# Frieren Ina Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A 1-in-4 surprise on each wake: Frieren Ina is summoned in place of nerd Ina, with her own faces, lines, staff-carrying takodachis and a summon-out back to sleeping Ina.

**Architecture:** `scene.js` stays the pure state machine and SVG drawer; the scene gains `form` and `face`, rolled from a salted hash of the turn id. Frieren's art (head, faces, kana line, staff, summon FX, cover tentacles) lives in a new `frieren.js` that `scene.js` imports. CSS keyed on a `f` class beside the state class (`wake f`, `doze f`) plays the summon sequences.

**Tech Stack:** Plain JS sprites as text grids, SVG + CSS keyframes, Claude Code mod hooks (`index.tsx`), tests via `claude plugin test plugins/anime-themes`.

**Spec:** `docs/superpowers/specs/2026-11-18-frieren-ina-design.md`

## Global Constraints

- Rolls are hash-based, never `Math.random`, inside state changes.
- 1 in 4 wakes from sleep → `form: 'frieren'`; face from `['plain', 'smug', 'cute']`, equally likely.
- Each of Frieren's two picked work lines comes from her pool 2 times in 3.
- "ZOLTRAAK!" appears nowhere.
- Farewell `SEE YOU AGAIN\nIN 100 YEARS~` on every Frieren doze.
- Worst-case `draw()` stays under 131,072 characters.
- Atom shape tag `scene-3`.

## Review Focus

- A new turn starting mid summon-out: `wake` from `doze` must settle to nerd sleep, then roll afresh.
- A question asked during a Frieren turn: `wait` keeps Frieren's head, `resume` keeps `form`.
- A subagent joining during the summon-out: it settles to nerd and gets no staff.
- Waking while already working (a second `turn.start`) keeps `form` and `face`.
- An `ask` ending: the "YOUR TURN~" bubble shows only after regular Ina is back.

---

### Task 1: State — form, face, staff

**Files:** Modify `hooks/themes/ina-pixel-dark/scene.js`, `scene.d.ts`, `types/index.d.ts`, `index.tsx` (shape tag); Test `hooks/register.test.tsx`

**Produces:** `Scene.form: 'nerd' | 'frieren'`, `Scene.face: 'plain' | 'smug' | 'cute'`, `Tako.staff: boolean`; `ASLEEP` has `form: 'nerd', face: 'plain'`.

- [ ] Test `Frieren Ina comes up on about one wake in four, with every face`: over 400 ids, Frieren count in 60..140; faces seen = 3; `wake(ASLEEP, 't').form` and `'t1'` are `nerd`.
- [ ] Test `Frieren's turn keeps her through questions, and the next change after she dozes is regular Ina`: wake(fr) → ask → resume keeps form; `join(doze(fr,'d','done'),'a')` has `form: 'nerd'` and no staff; `wake(wake(fr,'x'), 'y')` keeps form and face.
- [ ] Test `takodachis that join Frieren Ina carry Fern's staff`: join on a Frieren turn → `staff: true`; on a nerd turn → `false`.
- [ ] Implement in `wake`, `settle`, `join`; run tests; commit.

### Task 2: Art and lines

**Files:** Create `hooks/themes/ina-pixel-dark/frieren.js`; modify `scene.js`, `scene.d.ts`

**Produces:** from `frieren.js`: `frierenHead(face)`, `FX`, `COVER`, `STAFF`, `KANA` rows, `FR_SAY`, `FAREWELL`. From `scene.js`: `missingGlyphs(): string[]`.

- [ ] Test `every line Ina says has a glyph for every character`: `expect(missingGlyphs()).toEqual([])`.
- [ ] Add digits 0–9 to `FONT`; bubbles take a hand-drawn rows table for the kana line.
- [ ] `lines()` picks Frieren's wake line `WAH?!?`, her weighted work lines, the farewell, and a late "your turn" stay after an `ask` exit.
- [ ] Draw the head, faces, staff; run tests; commit.

### Task 3: Summon animations

**Files:** Modify `scene.js` (`draw`, `ina`, `takodachi`, CSS)

- [ ] Test `the scene draws Frieren Ina's summon-in and summon-out`: a Frieren wake draws `class="fh"` and `class="fx"`, no glasses; a Frieren doze draws `class="cover"`; a nerd wake draws none of them.
- [ ] Extend the size test with a Frieren doze and every takodachi staffed.
- [ ] Implement the CSS timeline from the spec; run tests; commit.

### Task 4: Words outside the scene, and a look

**Files:** Modify `index.tsx` (alt text, blurb), `README.md`

- [ ] Alt text says "summoned as Frieren" while she is out.
- [ ] Render each state to PNG in the browser pane and check the art.
- [ ] Run `claude plugin validate` and `claude plugin test`; commit.
