# Ao-chan — design

## Intent

Ao-chan is Ina's grimoire: a Necronomicon with a dark purple cover, a pink eye
in the middle of curling line-work, cream pages with a gold edge, and an orange
paper band with a tiny Ina face on it. This adds her to the `ina-pixel-dark`
backdrop as a **companion** who sometimes turns up for a turn. Ina stays where
she is, nerd or Frieren, and is excited to see her. It's a surprise for fun and
variety, like Frieren Ina.

## Goals

- On each wake from sleep, a separate roll decides whether Ao-chan comes.
- Ao-chan has her own arrival, her own idle motion while Ina works, and her own exit.
- Ina reacts with excitement when Ao-chan arrives.
- Ao-chan gets a few lines of her own in Ina's work loop.

## Non-goals

- No change to nerd Ina, Frieren Ina, the takodachis or the marks.
- No new theme, no command to force Ao-chan.
- The orange band's Japanese text is not drawn: it can't be read at this size.

## Anti-goals

- Ao-chan must never sit over the conversation, Ina's speech bubble or the tentacles.
  There's no space above or below Ina, so she stays inside the summoning circle.
- The scene must not break when a turn ends, a question is asked or a subagent
  joins mid-arrival: every redraw replays from the new state, as today.
- The SVG must stay under 131,072 characters with Frieren, Ao-chan and every
  takodachi coming and going at once.
- No real randomness in state changes: the roll comes from the hash of the turn id.

## Constraints found in the code

- `scene.js` is pure: state changes return a new `Scene`, and `draw(scene)` returns
  the whole SVG. `wake` and `doze` are the transition states; `settle` turns them
  into `work` and `sleep` on the next change.
- Ina's group is anchored at the right edge, vertically centred, at scale 5 (3 on
  narrow windows). The head grid is 42 × 32 with its middle at 21, 16. The circle
  behind her has a radius of 47 and a triangle whose lower-left corner is at about (−12, 35).
- The pixel font is capitals, digits, `!?.,'-~` and a few kana. Lines with other
  characters draw spaces.
- Today's test turn ids (`t`, `t1`, `t2`, `t3`, `d`, `q`, `a`, `again`) and the
  test `FRIEREN` id (`turn-0`) don't roll Ao-chan with the roll below, so existing
  tests keep their meaning.
- The scene atom is stored under `shape: 'scene-3'`; a new field needs `scene-4`.

## Approaches

1. **A flag on the scene, art in its own file (picked).** `Scene` gains `ao: boolean`.
   `draw` adds Ao-chan's group to Ina's when it's set, and picks her arrival or exit
   CSS from `scene.ina` (`wake` / `doze`). Her art, lines and keyframes live in a new
   `ao.js` beside `frieren.js`. This mirrors how Frieren Ina is built.
2. **Ao-chan as a special entry in `takos`.** Ruled out: takodachis come and go with
   subagents and stand on the left; Ao-chan belongs to Ina's turn and to Ina's circle.
3. **A third `form`** that replaces Ina. Ruled out by the user: Ina stays in the picture.

## Design

### State (`types/index.d.ts`, `scene.js`)

- `Scene` gains `ao: boolean`. `ASLEEP` has `ao: false`.
- `wake` from sleep rolls `hash('ao:' + id) % 5 === 0` → `ao: true` (1 in 5; my
  call). The roll is independent of Frieren's, so both together come up about 1
  wake in 20. Waking while already awake keeps `ao`.
- `ask` / `resume` / `join` / `leave` keep `ao`.
- `doze` keeps `ao` so her exit can be drawn; `settle` from `doze` → `ao: false`.
- The atom's shape tag goes to `scene-4`.

### Placement

Ao-chan rests on the summoning circle's lower-left mark, left of and below Ina's
chin, sitting on the circle's lower rings (option B of the mockups). Her book is about
18 × 24 pixels in the head grid, placed at about (−27, 19): that leaves a few pixels
between her and Frieren Ina's left twin tail (x ≥ −6) and elf ear. She is drawn
behind Ina's head and bubbles. Every frame keeps within the closed book's footprint,
give or take a pixel or two: she never reaches further left or down than that.
She moves with Ina's group, so `/ina-insets` and the phone layout carry her along.

### Ao-chan's look (`ao.js`)

From the reference: a thick book seen nearly front-on. It has a dark purple
cover with lighter purple line-work (a frame, and arcs curling round the middle),
the pink eye in the middle (a pink almond ring round a dark iris and a pink dot),
a darker spine on the left, cream pages with a gold edge along the top, and the
orange band across the bottom of the cover with a few dark marks for its text and
a tiny Ina face at the right.

Frames:

- **closed** — as above, eye open.
- **blink** — the eye closed to a line.
- **open** — the cover swung up and open with the cream pages fanned, and a flutter
  frame. It stays inside the closed book's footprint (above).

### Arrival (state `wake`, `ao: true`)

- Nerd Ina: Ao-chan is what wakes her. At 0.1 s the lower-left mark of the circle
  glows; at 0.2–0.8 s the book rises out of it, closed, with a few motes, bounces
  once and her eye opens. At 0.6 s Ina's wake line is **"AO-CHAN!!"** instead of her
  usual one, and she hops once with a few sparkles popping round her head. (Not a
  double hop: her head is big enough that hops this close together trip the
  desktop app's flash guard, which holds the backdrop still.)
- Frieren Ina: the summoning plays as now (0–1.8 s). At 1.9 s Ao-chan rises the same
  way, and at 2.0 s Frieren says **"AO-CHAN GET!"** for 1.8 s with the sparkles, so the
  bubble is gone before the looping "WAH!" at 4 s. Her usual "WAH?!?" at 0.4 s stays.

### While Ina works (`work`, and `wake` once she's in)

- She bobs on her own clock, out of step with Ina.
- Her eye blinks and glances left and right now and then.
- On each of Ina's WAHs she flips open a beat later, pages fluttering, then shuts,
  the way the takodachis hop to the WAHs.
- Ina's second picked work line (the one at 20 s) comes from Ao-chan's pool half the
  time, over whichever line nerd or Frieren Ina would have said there. Her first line
  is untouched, so Frieren's own lines still come up. Ao-chan's pool:
  `READ ALONG,\nAO-CHAN~`, `WHICH PAGE,\nAO-CHAN?`, `NO PEEKING,\nAO-CHAN!`,
  `AO-CHAN SAYS HI~`. (Frieren Ina's `AO-CHAN GET!` stays in her pool.)
- On a question (`wait`) she holds still with Ina, eye open.

### Exit (state `doze`, `ao: true`)

At 0.6 s the book snaps shut and her eye closes. At 1.0 s she sinks back into the
circle's mark with a small puff of ink and is gone.

- Nerd Ina: on a done, stop or error ending, her ending line is
  **"BYE BYE,\nAO-CHAN~"** instead of the usual one, then she dozes off as today. On a
  question ending her standing "YOUR TURN~" bubble is unchanged.
- Frieren Ina: her "SEE YOU AGAIN IN 100 YEARS~" farewell stays. Ao-chan leaves
  first, well before the tentacles rise at 3.0 s.

### Tests (`register.test.tsx`)

- About 1 wake in 5 brings Ao-chan (between 50 and 115 of 400 turn ids). Some of
  those come up with Frieren too. Existing test ids don't bring her.
- Ao-chan stays through `ask`/`resume`, `join`/`leave` and a wake while awake; the next change
  after `doze` has `ao: false`.
- `draw` contains Ao-chan's group on `wake`, `work` and `doze` with `ao`, never without;
  the wake draws her arrival and "AO-CHAN!!", and the doze draws her exit.
- Every character of Ao-chan's lines has a glyph.
- The size-limit test still passes with Frieren, Ao-chan and every takodachi coming and going.
  `FRIEREN` (`turn-0`) doesn't bring Ao-chan, so the tests get their own id that
  rolls both (about 19 of the 400 test ids do), and one that rolls Ao-chan alone.

### Other touches

- `index.tsx`: the Backdrop alt text adds "with Ao-chan the grimoire" while she's
  out; the theme blurb mentions her.
- README: the theme's row mentions Ao-chan.

## Calls made (not asked)

- "Ina will be exited when Ao-chan enters" is read as "Ina will be *excited*": Ina stays.
- She rises out of the circle's mark rather than dropping in from above, and for
  nerd Ina she arrives as Ina wakes (she's what wakes her), not 2 s later. Rising
  fits a spot inside the circle, and arriving early keeps her greeting clear of the first WAH.
- Ao-chan comes up 1 wake in 5, independently of Frieren.
- She stays the whole turn, and leaves when Ina dozes.
- On her arrival, Ina's wake line becomes "AO-CHAN!!" (nerd) / "AO-CHAN GET!" (Frieren).
- Her four lines, and that one of Ina's two work lines is hers half the time.
- She flips open on each WAH.
- Nerd Ina's ending line is "BYE BYE,\nAO-CHAN~" while Ao-chan leaves; Frieren keeps her farewell.

## Left to the builder

Exact pixel art, palette entries for the cream pages, timings within the
ranges above, and the CSS keyframes. As with Frieren Ina, Ao-chan's resting state
is her static style and the animations only cover her arrival, flips and exit. So
with reduced motion, or a redraw mid-arrival, she is plainly there in `work` and
`wait`, gone in `sleep`, and nothing of hers animates in `wait`.
