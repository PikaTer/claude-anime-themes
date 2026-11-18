# Shows when work lands — design

## Intent

When work lands (a commit, a deploy, a merge), Ina puts on a short, dramatic
show over her head, and every takodachi on screen reacts. Three shows:

| Show | When | Ina | Takodachis |
| --- | --- | --- | --- |
| Gold trophy | nerd Ina | A gold trophy rises over her head with turning rays, sparkles and falling confetti. A gold flash. "ANOTHER GOLD TROPHY FOR NINOMAE INA'NIS!" over four lines | Sunglasses drop onto their faces and glint |
| World domINAtion | nerd Ina with Ao-chan | The window darkens. Ao-chan flies up from her mark over Ina's head and throws herself open in a dark aura, her eye glowing red. Ina's lenses glare red and her head shakes. "WORLD DOMINATION", with INA in Ao-chan's pink | Wide-eyed, sweating and shaking under a flashing "!!", then they bow again and again with arms raised |
| Zoltraak | Frieren Ina | A magic circle opens over her head, lightning strikes it twice with flashes, it charges and fires a beam across the whole window at the takodachis. With none on screen it fires straight up off the window's top instead, and "ZOLTRAAK!!!" stands beside the circle, out of the beam's way. | Arms up, they raise barriers like Fern's: a flat honeycomb of about a dozen hexagons, thin white edges over translucent teal glass, popping in cell by cell and buzzing as the beam passes |

## How it fits the scene

- `Scene.special` holds the show: `{ kind, at, now }` in `$.clock.now()` milliseconds.
  `at` is when it starts. `now` is when the scene was made, so `draw` stays pure.
  Every show animation is timed from `--x = (at - now) / 1000` s, which goes
  negative on a redraw partway through.
- `settle` clears it. The hooks run every change through `carry(before, after, now)`,
  which keeps a show going to its end, a `join`, `leave` or `doze` included. A
  question (`wait`) ends it, and so does the next turn's wake from sleep.
- While a show plays, Ina's looping lines, her cue lines, her doze line and her
  lull (`--d`, with `--h` for Frieren's send-off and Ao-chan's exit) wait for it to end.
- Six seconds after a show ends, a `$.clock.after` timer calls `rest`. That drops
  the show and settles the scene the way the next change would, including a
  `wake` or `doze` the show held up. A later redraw (a resize) then plays nothing
  again.
- A change that changes nothing, such as a commit during a show, is not
  written: a write would redraw and replay what has already played.
- The show's art, defs and CSS live in `special.js`. They are drawn only while
  a show plays: idle, asleep and waiting cost nothing more, and the worst case
  (Frieren, Ao-chan, Zoltraak, 28 takodachis coming and going) stays under the
  131,072-character Svg limit.
- Without a readable clock (as in a test with no `mock.clock`) there are no shows;
  everything else goes on.

## Triggers (`index.tsx`)

- **The prompt**: `commit`, `deploy`, `merge` or `merging` as the start of a word
  (`commits`, `deployed`, `merged`). The turn opens with the show, once Ina's
  greeting is done: 3.1 s for nerd Ina, 4 s for Frieren Ina's summoning.
- **A tool call that succeeded** (`classic.PostToolUse`, so a failed one or a refused
  one never counts, and the tool is not held up), in the main turn or a subagent's:
  - Bash, when one command of the chain has `commit`, `merge` or `deploy` as a
    word of its own. `git merge-base`, `cat deploy.yml`, `ls deploy/` and
    `--grep=merge` don't count. Neither do commands that only look: `grep`,
    `cat`, `ls`, `echo`, `git log` and their like;
  - a server's tool named for landing work: `create_deployment`, `create_commit`,
    `merge_pull_request`, or a name starting `deploy`, `merge` or `commit`. Tools
    that only read (`get_deployment`, `list_deployments`) do not count.
- A show never starts over one that is playing.

## Calls made (not asked)

- Zoltraak whenever Frieren Ina is out, Ao-chan too. With nerd Ina, Ao-chan's
  show whenever she is out; otherwise the trophy, Ao-chan coming for her show on
  one in three (from the hash of the call's id). Once summoned, she stays the turn.
- "On top of Ina" is read as over her head. Ina's line goes above what rises
  there, right-aligned like her own lines. A bubble beside her face would reach
  into the takodachis at the app's 300/345 px insets on a 1280-wide window. So
  "ZOLTRAAK!!!" is drawn at normal size, and the trophy line is broken over four lines.
- Both the prompt and the command count. "Commit this" followed by `git commit`
  gives two shows when they are more than 7 s apart.
- Subagents' commits count too.
- Zoltraak flashes the whole window white five times (two lightning strikes,
  two more as the circle charges, and the beam); the trophy flashes gold once
  and Ao-chan red once. The window darkens for Ao-chan and Zoltraak.
- Shows last 7 s. Reduced motion shows none of them: their art rests hidden.
- "World DomINAtion" is drawn in capitals, the only letters the font has, with
  the INA in pink.
- The barrier's hexagons are drawn as shapes, not pixels: hexagons this small
  come out round in pixels. Each panel leans toward Ina and keeps clear of the
  takodachis' left edge, where their layer is cut.
- Zoltraak takes aim again at every change until it fires (2.6 s in): a
  takodachi that comes while it charges turns it on them, and the last one
  leaving turns it to the sky. Once fired, it keeps its aim.
