# Christmas Ina — design

## Intent

For the festive season, the `ina-pixel-dark` backdrop sometimes dresses for
Christmas. It's for fun, like the other variations.

## Goals

- Only in November and December, and only for one chat session in two. The roll
  is made once when the session starts and holds for the whole session. It hashes
  the session's id, so a reload of the same session rolls the same way. (Not
  checked: whether a resumed session keeps its id, and what `/clear` does, since
  it starts a new id without a new `session.start`.)
- It goes on top of the other variations: nerd, Frieren and cat Ina all show up as
  usual, each in a Santa hat. Ao-chan, held takodachis and the shows still happen.
- What changes:
  - **Ina:** a Santa hat with a pompom drooping to the right. Cat Ina's ears poke
    out on each side of it.
  - **Takodachis:** a small Santa hat in place of the halo. About one in four wears
    reindeer antlers and a red nose instead. Held takodachis wear hats. With cat
    ears, the hat goes over them and the tips peek out.
  - **Ao-chan:** a red ribbon and bow, like a wrapped present, also in her show.
  - **Sky:** half the marks become snowflakes, and a light snowfall drifts down
    while Ina is up, fainter over the conversation. Asleep, the flakes hold still
    like the marks. A redraw restarts them, as it does the marks' blinks.
  - **Summoning circle:** holly sprigs on its ring.
  - **Lines:** festive ones mixed in ("MERRY CHRISTMAS!", "HO HO HO~"), and cat
    Ina's own ("MERRY NYASMAS~").
  - **Gold trophy show:** a wrapped present instead of the trophy, with its own line.

## Non-goals

- No change outside November and December, or in the other session in two.
- No new show, form or roll beyond the session's festive roll and the antlers.
- No way to force it on. Open a new session to roll again.

## Anti-goals

- Nothing may trip the desktop app's flash guard. The snow is small, faint and
  slow, and gets checked with `tools/flash-check` (new festive cases).
- The scene must stay under its 131,072-character limit in its worst case, now
  measured festive too. The plain worst case was 129.8 KB, about 1.3 KB short of
  the limit, and Christmas first came out about 8.6 KB too big. To make room, each
  takodachi's laptop, cookie and staff glint is now drawn once in `<defs>` and
  reused with `<use>` (their animations no longer wait for the takodachi to be in
  or on screen, so a leaving takodachi's arms keep bobbing). The festive art is
  shared definitions too. Worst case after: about 120 KB plain, 126 KB festive.

## Approaches

- **On top of the forms** (picked): every form wears a hat, so you don't lose
  Frieren or cat Ina in festive sessions. Costs a hat that fits all three heads.
- **Replaces the forms**: festive sessions only show nerd Ina. Not picked.

## How it's built

- `startIna` rolls festive from `$.clock.now()` (month) and `$.session.id()`, and
  keeps the answer in a session atom `ina-xmas`. If either call fails, it's not festive.
- `draw(scene, insets, grips, festive)` takes the flag. The Christmas art lives in
  `xmas.js`. In a festive scene, `#tako` is drawn without its halo, and a hat (`#xh`)
  or antlers (`#xa`) are drawn over it.
- Ina's speech bubbles rise 5 pixels in a festive scene to clear the hat.
