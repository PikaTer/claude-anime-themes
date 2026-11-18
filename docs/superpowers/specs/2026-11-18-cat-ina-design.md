# Cat Ina (Ninyomanyo Ninya'nis) — design

## Intent

The `ina-pixel-dark` backdrop has a pixel Ina who sleeps while Claude is idle and
wakes as nerd Ina, or now and then as Frieren Ina. This adds a third form,
**Ninyomanyo Ninya'nis**, or cat Ina: Ina with cat ears. She wakes surprised,
transforms in front of a summoning circle that turns into a heart, talks in
"nya", and turns everyone around her cat-eared: the takodachis that join her
and Ao-chan, who also grows a tail. When work lands, her shows have a cat
touch, and Ao-chan's show turns from world domination into love. It's for fun
and variety, like Frieren Ina and Ao-chan.

## Goals

- On each wake from sleep, the form roll can come up cat Ina, about 1 wake in 5,
  never together with Frieren Ina.
- She has her own arrival (a surprised "INYA?!?", sparkles, ears popping up one at a
  time, the round circle glowing and turning into a heart) and her own exit ("BYE
  NYA~", then back to regular Ina).
- Her own lines, mixed in with Ina's usual ones, which she says "nyanified".
- Takodachis that join while she is out have cat ears for their whole stay.
  Ao-chan, while out with her, has cat ears and a tail.
- Shows, chosen as for nerd Ina (option B): the gold trophy, with a cat touch, or
  Ao-chan's show when Ao-chan is out or on 1 in 3. With cat Ina, Ao-chan's show is the
  love version: hearts instead of the dark aura, Ina's heart circle glowing, and
  the takodachis' eyes turned to hearts.

## Non-goals

- No change to nerd Ina, Frieren Ina, their shows, the marks, or the takodachi
  entrances and exits.
- No new theme in `/anime-theme`, no command to force cat Ina.
- No new glyphs: everything she says fits the pixel font (capitals, digits, `!?.,'-~`).

## Anti-goals

- Nothing may trip the desktop app's flash guard (it freezes the backdrop): the
  sparkles, ears, heart circle, rising hearts and the love show stay as slow as the
  existing shows. Checked with `tools/flash-check`.
- The SVG stays under 131,072 characters in every worst case, Frieren's included.
  Frieren's worst case (dozing, Zoltraak, 28 takodachis coming and going) is
  127,719 today, so **nothing of cat Ina's may be drawn, or put in the shared CSS
  or defs, unless she (or a cat-eared takodachi) is on screen.** Cat Ina's own worst
  case (dozing, Ao-chan's show, 28 eared takodachis) starts from nerd Ina's, about
  97,600 today, so she has about 30 KB for her art, CSS and defs.
- No real randomness in state changes: rolls come from the hash of the turn id.
- Today's tests keep their meaning: none of their turn ids may roll cat Ina, and
  Frieren still comes up 1 wake in 4 for the same ids as now.

## Constraints found in the code

- `scene.js` is pure; `draw(scene)` returns the whole SVG and CSS animations play once
  per draw. `wake` and `doze` are the transitions, and `settle` turns them into `work`
  and `sleep`. Frieren Ina is built as `form: 'frieren'` with art in `frieren.js`, and
  this follows the same pattern.
- The shows (`special.js`) are `trophy`, `ao` and `zoltraak`. `stage()` picks one by form;
  `showParts(kind, { …, nerd })` already takes a flag for nerd Ina's red lenses.
- The atom's shape tag is `scene-6` (`index.tsx`); a new form value and a new `Tako`
  field need `scene-7`.
- The takodachis' WAH echo is one shared def (`#wah`), and `draw` finds the WAH lines
  with `slot.text.includes('WAH')`.

## Approaches

1. **A third form, `form: 'cat'`, art in `cat.js` (picked).** This is built like Frieren Ina.
   The shows aren't given new kinds: `showParts` is told cat Ina is out and swaps in
   her variants. Because forms exclude one another, the worst case is the biggest
   single form, not all of them added together.
2. **Cat ears as an add-on flag, like `ao`.** Ruled out: the user asked for a third form, and
   Frieren and cat drawn together would break the size limit.
3. **New show kinds for the cat trophy and the love show.** Ruled out: they would
   duplicate most of the trophy and Ao-chan show art and timing for nothing.

## Design

### State (`types/index.d.ts`, `scene.js`)

- `form: 'nerd' | 'frieren' | 'cat'`.
- `wake` from sleep: Frieren as now (`roll % 4 === 0`). Otherwise cat Ina on a slice
  of the same roll worth 4 in 15 of what is left, so about 1 wake in 5 overall (e.g.
  `(roll >>> 4) % 15 < 4`). The builder may pick another slice, as long as it's
  about 1 in 5 and no existing test id rolls cat. `face` stays `plain` for cat Ina,
  `hair` is rolled as for every form, and the Ao-chan roll is independent (both
  together about 1 wake in 25).
- Waking while awake, `ask`/`resume`, `join`/`leave` keep `form`; `doze` keeps it for the
  exit, and `settle` from `doze` resets it to `nerd`, as for Frieren.
- `Tako` gains `ears: boolean`. `join` sets it while `form === 'cat'`, and it keeps
  it for its whole stay. `staff` and `ears` never both hold.
- `stage()` treats cat Ina like nerd Ina: Ao-chan's show if she is out or on 1 in 3,
  else the trophy. A show asked for in the prompt waits 4 s for her arrival (as for
  Frieren), and her doze's lull (`--d`) is about 4 s plus any show's hold.
- Shape tag `scene-7`.

### Cat Ina's look (`cat.js`)

- Regular Ina's head (her rolled hair ends, the ahoge), no glasses.
- **Two cat ears** at the top corners of her head, over the hair tufts the crown already has
  there (left and right of the ahoge), hair purple with an outline and a pink inner ear
  (blush pink). They stay inside the head grid, reaching up to y = −1 at most: her speech
  bubbles' tails end at y = −2, and the trophy and Ao-chan's show book sit just above that.
- **Face:** open eyes like regular Ina's, and a small `:3` cat mouth, with blush.
  During the arrival, a **surprise face**: wide round eyes and a small open "o" mouth.
- **The heart circle:** a summoning circle in the shape of a heart, same centre and about
  the same size as the round sigil. It has a double heart outline, rune ticks along it
  and a small heart in the middle, in pinks and the sigil's purples. It replaces the
  round sigil while she is out, and pulses gently like it. It keeps a node at the round
  sigil's lower-left triangle corner (about −12, 35): Ao-chan rises from, glows at and
  sinks into that mark.
- **Size budget:** the round sigil's markup is about 10,800 characters, and on wake and doze
  both circles are drawn. The heart circle gets at most about 9,000 (fewer rings than the
  sigil, or drawn as SVG shapes like the barrier if pixels cost too much). Everything else
  of hers in her worst case (ears, faces, sparkles, CSS, ear and NYAH defs, Ao-chan's ears and
  tail, the love show's extras) gets at most about 15,000.

Same 42 × 32 head grid and anchor as the other forms, so bubbles, Ao-chan and the
tentacles line up. Her art, the heart circle and her CSS are drawn only when
`form === 'cat'`.

### Arrival (state `wake`, `form: 'cat'`), about 2.5 s

1. 0.0 s — sleeping Ina; the round circle brightens.
2. 0.4 s — her eyes snap open into the **surprise face**, a single hop, bubble **"INYA?!?"**.
3. 1.0 s — sparkles twinkle around her head (pink and white, slow, like Frieren's).
4. 1.3 s — the **left ear pops up**, and at 1.7 s the **right ear** (a small scale/rise pop each).
5. 1.3–2.1 s — the circle glows and the round sigil fades out in steps while the heart
   circle fades in.
6. 2.2 s — the surprise face gives way to her `:3` face; she bobs and her work lines begin.

With Ao-chan out, she rises at 1.9 s and cat Ina says **"AO-NYAN!!"** at 2.0 s for 1.8 s,
the same timing as Frieren's "AO-CHAN GET!", so it ends before the first looping line and
any show at 4 s.

### Lines

- **Nyanify** (a function in `cat.js`): for cat Ina, every line from the shared pools
  (`SAY.*`, Ao-chan's lines, "WAH!") goes through `WAH` → `NYAH`, `NA` → `NYA`,
  `NO` → `NYO`, `AO-CHAN` → `AO-NYAN`. So `WAH!` becomes `NYAH!`, `INA INA INA~` becomes `INYA INYA INYA~`
  and `COOKIES NOW?` becomes `COOKIES NYOW?`. Her own pool and her set lines are not run
  through it. `draw`'s WAH detection must also match `NYAH`. When she picks her two work
  lines, `WAH-T IS THIS?` (which would come out `NYAH-T IS THIS?`) is skipped from the shared
  pool: she has `NYA-T IS THIS?` of her own.
- The takodachis' echo of her looping WAH says **"NYAH!"**: a second echo def, emitted only
  while she is out.
- **Her pool**, mixed in like Frieren's (each of her two picked work lines is hers two times
  in three):
  - `IT IS I,\nNINYOMANYO\nNINYA'NIS!`
  - `INYA, INYA, INYA`
  - `TAKONYACHI!`
  - `NYA-T IS THIS?`
  - `PURR PURR~`
  - `PAWS FOR A BREAK~`
  - `HISSS... A BUG!`
  - `KNEADING THE CODE~`
  - `LOVE THE FLOOR,\nINYA~` (two lines: on one it would be wider than any line so far)
- With Ao-chan out, the second line is hers half the time, as now (nyanified).

### Exit (state `doze`, `form: 'cat'`), about 4 s

1. 0.1 s — **"BYE NYA~"**, on every ending, as Frieren's farewell is. It replaces "BYE BYE,
   AO-CHAN~"; Ao-chan leaves as she does now.
2. 1.8 s — sparkles; the right ear pops down, then the left (reverse order).
3. 2.0–2.8 s — the heart circle fades in steps back into the round sigil.
4. 2.8 s — regular Ina, eyes open; then she dozes off as today. On an `ask` ending
   the "YOUR TURN~" bubble (not nyanified: she is regular Ina by then) appears after this.

### Takodachis with cat ears

`ears: true` adds a pair of small cat ears on its head (takodachi purple, pink
inner), riding with its bob and hops. It's one def (`#cear`) placed with `<use>`, emitted
only when some takodachi on screen has ears. So 28 ears cost little, and Frieren's
scene pays nothing unless an eared takodachi is still around from an earlier turn.

### Ao-chan with cat ears and a tail

While `form === 'cat'` and `ao`, Ao-chan's book has two small cat ears on its top
edge and a thin tail curling up from her top-right corner (not from the spine on her left,
which is the circle's outer edge, towards the conversation), with a slow sway (two frames at about
0.8 s a frame). They are on her closed and open frames, and on the book in her show.
They stay within a few pixels of her footprint, clear of Ina's hair and bubbles.

### Shows with cat Ina

`showParts` gains a `cat` flag (beside `nerd`, which is false for her: no red lenses).

**Trophy, cat touch.** The same show, with:
- gold cat ears on the trophy cup's rim;
- the line `ANOTHER\nGOLD TROPHY\nFOR NINYOMANYO\nNINYA'NIS!` (no line wider than
  Frieren's widest, `WHAT IN THE WORLD`);
- takodachis put on their sunglasses as now, eared or not.

**Ao-chan's show, love version.**
- The window takes a faint pink tint instead of darkening, and its one faint flash is
  pink instead of red.
- Ao-chan flies up (with her ears and tail) and throws herself open as now, but instead of
  the dark aura, a pink-and-red **heart-shaped aura** (two frames, turning at 0.8 s a frame,
  like the aura), with small pixel **hearts rising** from her in slow steps. Her eye glows pink.
- **Ina's heart circle glows with love**: it brightens to full and pulses pink for the show.
- Cat Ina hops once in delight (instead of the recoil) and blushes.
- Line: `WORLD\nDOM{INYA}TION`, the INYA in pink.
- **Takodachis' eyes turn to hearts**: every takodachi on screen (eared or not) gets
  pink heart eyes and blush in place of the terror face, and a small heart pops over it
  instead of the "!!". They raise their arms and sway gently rather than tremble and bow.
- Its CSS and defs are emitted only for this variant, like the existing show parts.

### Tests (`register.test.tsx`)

- About 1 wake in 5 rolls cat Ina (between 50 and 115 of the 400 test ids), never with
  Frieren; Frieren's count is unchanged. The named test ids (`t`, `t1`, `FRIEREN`, `BOTH`, …)
  don't roll her. Tests that sweep all 400 ids (Ao-chan's line counts, the hair counts)
  have their bounds re-checked and re-derived where cat turns change them.
- Her wake draws "INYA?!?", the ears and the heart circle; a nerd or Frieren wake draws none
  of her parts. `doze` draws "BYE NYA~" on every ending, and the next change has
  `form: 'nerd'`.
- Shared lines come out nyanified for her (`NYAH!`, `INYA`), never for nerd or Frieren Ina.
- A takodachi joining during a cat turn has `ears: true`; during other turns it never does.
- Ao-chan's ears and tail are drawn only with cat Ina.
- A cat turn's shows: the trophy with its cat line, and Ao-chan's love show (hearts,
  heart eyes, no terror face, no red lenses); `stage` never picks Zoltraak for her.
- Every character of her lines, nyanified pools included, has a glyph.
- Size: a new worst case, cat Ina dozing with Ao-chan's love show and 28 eared takodachis
  coming and going, stays under 131,072; Frieren's existing worst case still does.

### Flash check (`tools/flash-check/cases.mjs`)

Add cases for cat Ina's wake, her doze, the cat trophy and the love show (and their
redrawn-partway versions, as the other shows have). Run
`node tools/flash-check/check.mjs --control --sizes all`; it must exit 0.

### Other touches

- `index.tsx`: alt text "transformed into Ninyomanyo Ninya'nis, cat ears and all" while she
  is out; the theme blurb and README row mention her.

## Calls made (not asked)

- She comes up about 1 wake in 5, never with Frieren; nerd Ina stays the most common (about 55%).
- No glasses: the ears replace them. Her face is open eyes with a `:3` mouth and blush.
- Nyanify rules: `WAH`→`NYAH`, `NA`→`NYA`, `NO`→`NYO`, `AO-CHAN`→`AO-NYAN`, on shared lines only; the takodachis' echo is "NYAH!".
- The cat ears stay within her head's grid, over her crown's hair tufts, not on top of it.
- Her pool: the three lines you gave plus six of the suggestions.
- "BYE NYA~" plays on every ending and replaces "BYE BYE, AO-CHAN~".
- The heart circle stays the whole turn and turns back to round at the exit.
- With Ao-chan, she greets her with "AO-NYAN!!".
- Trophy cat touch: gold cat ears on the cup and her full name in the line.
- Love show: pink tint, heart aura and rising hearts, `WORLD DOMINYATION`, Ina hops
  and blushes; takodachis cheer with heart eyes instead of cowering.

## Left to the builder

Exact pixel art (ears, faces, heart circle, heart aura, heart eyes, Ao-chan's ears and
tail), palette entries for the pinks, exact timings within the ranges above, the CSS
keyframes, and the exact roll slice. As with the other forms, her resting state is
the static style, and the animations only cover arrival, exit and shows. With reduced
motion she is plainly there with ears and the heart circle in `work` and `wait`.
