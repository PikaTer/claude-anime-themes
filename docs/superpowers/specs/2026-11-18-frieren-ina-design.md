# Frieren Ina — design

## Intent

The `ina-pixel-dark` theme shows a pixel Ina who sleeps while Claude is idle and
wakes in nerd glasses while the main agent works. This adds a rarer, surprise
variant: on some turns a summoning circle brings in **Frieren Ina** — Ina
cosplaying Frieren — instead of nerd Ina. She has her own arrival, her own
lines, her own look for any takodachi that turns up, and her own exit back to
regular, sleeping Ina. It is for fun and variety; nerd Ina stays the usual.

## Goals

- On each wake from sleep, a random roll decides nerd Ina or Frieren Ina.
- Frieren Ina has a distinct summon-in and summon-out sequence.
- Frieren Ina comes with one of three faces, equally likely: plain
  (deadpan), smug, cute.
- Frieren Ina mixes her own lines in with the usual ones, the specials more often.
- Takodachis that join while she is out carry Fern's staff.

## Non-goals

- No new theme in `/anime-theme`, no command to force Frieren Ina.
- "ZOLTRAAK!" is **not** used: kept back for a special occasion later.
- No change to nerd Ina, sleeping Ina, the marks, or the takodachi entrances and exits.

## Anti-goals

- The scene must not break or stutter when a turn ends or a subagent joins mid-sequence:
  every redraw replays from the new state, as today.
- The SVG must stay under the 131,072-character limit with every takodachi coming
  and going at once (the existing test).
- No real randomness inside `scene.js`'s state changes: rolls come from the hash of the
  turn or agent id, as every other choice there does, so tests stay deterministic.

## Constraints found in the code

- `hooks/themes/ina-pixel-dark/scene.js` is pure: state changes (`wake`, `doze`, `join`, …)
  return a new scene; `draw(scene)` returns the whole SVG, and CSS animations play once
  per draw. Transitions are the states `wake` and `doze`; `settle` turns them into `work`
  and `sleep` on the next change.
- The pixel font has capital Latin letters and `!?.,'-~ ` only: no digits, no kana, and
  `letters()` is fixed at five rows. An unknown character silently draws as a space.
- The scene atom in `index.tsx` is stored under `shape: 'scene-2'`; a new stored shape
  needs a new tag.
- Worst case today (14 takodachis, every way in and out at once) is 66,670 characters
  of the 131,072 limit.
- Sprites are text grids, one character a pixel, through the `PAL` palette.

## Approaches

1. **Extend the existing scene (picked).** The scene state gains who is out and her face;
   `draw` picks the head art and the transition CSS by them. Frieren's art and lines live
   in a new `frieren.js` beside `scene.js`, so the main file stays readable.
2. **A separate theme** in the picker. Ruled out: the roll has to happen inside the Ina
   scene on each wake.
3. **An overlay layer** drawn on top of nerd Ina. Same state change as 1, but two heads
   stacked all the time would double the head art in every draw for nothing.

## Design

### State (`types/index.d.ts`, `scene.js`)

`Scene` gains:

- `form: 'nerd' | 'frieren'` — who is out. `ASLEEP` has `nerd`.
- `face: 'plain' | 'smug' | 'cute'` — Frieren's face; ignored for nerd.

- `wake` from sleep rolls: `hash(id) % 4 === 0` → `frieren` (1 in 4; my call), and the face
  from another slice of the same hash, `% 3`. Waking while already awake keeps `form` and `face`.
- `doze` keeps `form` for the drawing of the exit; `settle` from `doze` → `sleep` resets
  `form` to `nerd`.
- `ask`/`resume` keep `form`: Frieren Ina holds still on a question like nerd Ina does.
- `join` while `form === 'frieren'` gives the new takodachi `staff: true` (a new `Tako`
  field) on top of its laptop or cookie; it keeps the staff for its whole stay.
- The atom's shape tag goes to `scene-3`.
- Existing test turn ids (`t`, `t1`) do not roll Frieren, so today's tests keep their meaning.

### Frieren Ina's look (`frieren.js`)

From the reference: Ina's purple hair and orange tips, now in Frieren's high twin
tails, long pointed elf ears, red drop earrings, and the white collar with gold trim and
a red gem at her neck. No glasses. Same 42 × 32 head grid and anchor as nerd Ina so
the circle, bubbles and tentacles line up.

Faces (eyes and mouth over the head):

- **plain** — the cosplay reference's deadpan: fully open, neutral eyes, small flat mouth.
- **smug** — half-lidded, curved eyes and a closed smile.
- **cute** — scribbled-shut line eyes and a `:3` cat mouth.

### Summon-in (state `wake`, `form: 'frieren'`), about 2.5 s

1. 0.0 s — sleeping Ina; the circle behind her brightens and particles (single pixels in
   the circle's gold and lilac) rise from it.
2. 0.4 s — her eyes snap open, a hop, bubble **"WAH?!?"**.
3. 1.3 s — the circle flares: a column of light and a ring of sparkles over her head. At
   its peak (one step), nerd/sleeping Ina's head is swapped for Frieren Ina's.
4. 1.8 s — the light fades; Frieren Ina bobs and her work lines begin.

### Work lines

The work loop keeps its shape (`WAH!`, then two picked lines). For Frieren Ina each of
the two picked lines comes from her pool two times in three, and from the usual pool
otherwise.

Her pool:

- `WHAT IN THE WORLD\nIS DOOM?`
- `くらいよー！こわいよー！` — the kanji in 暗い/怖い are too dense for pixels, so it is
  written in kana. Kana do not read at five rows either, so the font gains seven-row
  kana glyphs (く ら い よ こ わ ー ！); a line with them is set on a common foot (two
  lines: くらいよー！ / こわいよー！).
- `YAMETE YO~`
- `MIMIC? MIMIC!`
- `JUST ONE MORE\nCHEST~`
- `TAKODACHIS,\nDON'T BE MAD~`
- `ONLY 10 YEARS?\nSHORT~`
- `AO-CHAN GET!`

The font gains digits `0`–`9`.

### Summon-out (state `doze`, `form: 'frieren'`), about 5 s

1. 0.0 s — Frieren Ina says **"SEE YOU AGAIN\nIN 100 YEARS~"**, whatever the ending.
2. 2.4 s — the circle glows and particles rise, as in the summon-in.
3. 3.0 s — tentacles (the existing tentacle art, a pair) rise from below her and cover
   her head.
4. 3.6 s — hidden behind them, Frieren Ina's head is swapped for regular Ina's (open
   eyes, no glasses).
5. 3.8 s — the tentacles sink away; regular Ina is back.
6. 5 s — after a moment awake, she dozes off as today: half-closed eyes, closed, the Z's float back.
   On an `ask` ending her standing "YOUR TURN~" bubble appears after this, as now.

On a Frieren exit the farewell replaces the usual done, stop and oops lines on every
ending, not only on a finished one (my call).

### Takodachis with Fern's staff

`staff: true` adds, beside the laptop or cookie, a tall staff held upright at its
side: Fern's long wooden staff with its curled head and a purple ribbon tied below it,
with a sparkle at the tip now and then. The staff is drawn once in `<defs>` and placed
with `<use>`, so 14 staffs cost little. Frieren's head is drawn inline: there is only ever one.

The pixel helpers (palette, `px`, plotting, `tentacle`) move to `pixels.js` so
`frieren.js` can share them; `tentacle` gains a tip thickness for the covering tentacles.
Ina's group is anchored 4 pixels further from the right edge so the elf ear's tip fits.

### Tests (`register.test.tsx`)

- A turn id whose hash rolls Frieren draws her head and the summon-in; one that does not
  draws nerd Ina as today.
- All three faces come up across turn ids; dozing draws the farewell and returns to
  `form: 'nerd'` on the next change.
- A takodachi joining during a Frieren turn has `staff: true`; one joining a nerd turn
  never does.
- Every character of every line, nerd and Frieren, has a glyph.
- The size-limit test still passes with a Frieren summon-out and every takodachi moving.

### Other touches

- `index.tsx`: the Backdrop alt text names Frieren Ina while she is out (it says
  "working in nerd glasses" today), and the theme blurb mentions her.
- README: the theme's row mentions the Frieren Ina surprise.

## Calls made (not asked)

- Frieren Ina comes up 1 in 4 wakes.
- Each of her two work lines comes from her pool 2 times in 3.
- 暗いよー！怖いよー！ is drawn in kana.
- The farewell plays on every ending, including stop, error and question.
- The staff is added next to the laptop or cookie, rather than replacing them.

## Left to the builder

Exact pixel art, palette entries, timings within the ranges above, and the CSS
keyframes for particles and the light column.
